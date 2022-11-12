import * as cdk from "aws-cdk-lib";
import { Template, Capture, Match } from "aws-cdk-lib/assertions";
import * as StatelessStack from "../lib/stateless-stack";
import * as CertStack from "../lib/cert-stack";

describe("S3 Bucket", () => {
  const app = new cdk.App();

  const stack = new StatelessStack.StatelessStack(app, "MyTestStack", {
    env: {
      account: "1234567890",
      region: "ca-central-1",
    },
    certificate: undefined,
    crossRegionReferences: true,
    isProduction: false,
  });

  const template = Template.fromStack(stack);

  it("is created", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: "nourez-dev",
    });

    template.resourceCountIs("AWS::S3::Bucket", 1);
  });

  it("is configured to host a static website", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      WebsiteConfiguration: {
        IndexDocument: "index.html",
        ErrorDocument: "error.html",
      },
    });
  });
  it("is configured to auto-delete objects", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      Tags: [
        {
          Key: "aws-cdk:auto-delete-objects",
          Value: "true",
        },
        {},
      ],
    });
  });
});

describe("S3 Bucket Deployment", () => {
  const app = new cdk.App();

  const stack = new StatelessStack.StatelessStack(app, "MyTestStack", {
    env: {
      account: "1234567890",
      region: "ca-central-1",
    },
    certificate: undefined,
    crossRegionReferences: true,
    isProduction: false,
  });

  const template = Template.fromStack(stack);

  it("is created", () => {
    template.hasResourceProperties("Custom::CDKBucketDeployment", {});
    template.resourceCountIs("Custom::CDKBucketDeployment", 1);
  });
});

describe("CloudFront Distribution in nonprod", () => {
  const app = new cdk.App();

  const stack = new StatelessStack.StatelessStack(app, "MyTestStack", {
    env: {
      account: "1234567890",
      region: "ca-central-1",
    },
    certificate: undefined,
    crossRegionReferences: true,
    isProduction: false,
  });

  const template = Template.fromStack(stack);

  it("is created", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {});
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
  });

  it("is configured to use the S3 bucket as the origin", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        Origins: [
          {
            DomainName: {
              "Fn::Select": [
                2,
                {
                  "Fn::Split": [
                    "/",
                    {
                      "Fn::GetAtt": ["CloudResumeBucket4ACE66D9", "WebsiteURL"],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    });
  });

  it("Redirects HTTP to HTTPS", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: "redirect-to-https",
        },
      },
    });
  });
  it("does not use a certificate", () => {
    const certCapture = new Capture();

    template.hasResourceProperties(
      "AWS::CloudFront::Distribution",
      Match.not(
        Match.objectLike({
          DistributionConfig: {
            ViewerCertificate: certCapture,
          },
        })
      )
    );
  });

  it("does not use a custom domain name", () => {
    const domainNameCapture = new Capture();

    template.hasResourceProperties(
      "AWS::CloudFront::Distribution",
      Match.not(
        Match.objectLike({
          DistributionConfig: {
            Aliases: domainNameCapture,
          },
        })
      )
    );
  });
});

describe("CloudFront Distribution in prod", () => {
  const app = new cdk.App();

  const certStack = new CertStack.CertStack(app, "MyTestCertStack", {
    env: {
      account: "1234567890",
      region: "us-east-1",
    },
    crossRegionReferences: true,
  });

  const stack = new StatelessStack.StatelessStack(app, "MyTestStack", {
    env: {
      account: "1234567890",
      region: "ca-central-1",
    },
    certificate: certStack?.cert,
    crossRegionReferences: true,
    isProduction: true,
  });

  const template = Template.fromStack(stack);

  it("is created", () => {});
  it("is configured to use the S3 bucket as the origin", () => {});
  it("Redirects HTTP to HTTPS", () => {});
  it("uses a certificate", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        ViewerCertificate: {
          AcmCertificateArn: {},
        },
      },
    });
  });

  it("uses a custom domain name", () => {
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        Aliases: ["nourez.dev", "www.nourez.dev"],
      },
    });
  });
});
