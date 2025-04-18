#!/usr/bin/env node
import "source-map-support/register";

import * as path from "path";
import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3dep from "aws-cdk-lib/aws-s3-deployment";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as cfo from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

const WEB_DIST_DIR = path.resolve(__dirname, "../../dist");

class WebService extends Construct {
  cfUrl: string; // AWS-generated URL

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // static assets bucket
    const staticAssetsBucket = new s3.Bucket(this, "StaticAssets", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, // needed for publicReadAccess
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL, // needed for publicReadAccess
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // needed to support the removal policy
    });

    const staticAssetsOrigin = new cfo.HttpOrigin(
      staticAssetsBucket.bucketWebsiteDomainName,
      {
        protocolPolicy: cf.OriginProtocolPolicy.HTTP_ONLY,
      },
    );

    const mainDistro = new cf.Distribution(this, "Distro", {
      defaultBehavior: {
        origin: staticAssetsOrigin,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.HTTPS_ONLY,
      },
    });

    // deploy static assets and invalidate distro
    new s3dep.BucketDeployment(this, "DeployStaticAssets", {
      sources: [s3dep.Source.asset(WEB_DIST_DIR)],
      destinationBucket: staticAssetsBucket,
      distribution: mainDistro, // trigger invalidation of entire distro
    });

    this.cfUrl = `https://${mainDistro.domainName}`;
  }
}

interface MainStackProps extends StackProps {}

class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    const webService = new WebService(this, "WebService");

    new CfnOutput(this, "WebCloudFrontURL", {
      value: webService.cfUrl,
      description: "CloudFront-generated service URL",
    });
  }
}

const app = new App();
new MainStack(app, "TickerStack", {
  env: {
    account: "941159756364",
    region: "ca-central-1",
  },
});
