#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StatelessStack } from "../lib/stateless-stack";
import { CertStack } from "../lib/cert-stack";
import { StatefulStack } from "../lib/stateful-stack";

const app = new cdk.App();
const isProd = process.env.CDK_DEFAULT_ACCOUNT === "REDACTED";

const certStack = isProd
  ? new CertStack(app, "CertStack", {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: "us-east-1",
      },
      crossRegionReferences: true,
    })
  : undefined;

new StatelessStack(app, "StatelessStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  certificate: certStack?.cert,
  crossRegionReferences: true,
  isProduction: isProd,
});

new StatefulStack(app, "StatefulStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
