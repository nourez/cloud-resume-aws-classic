import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CertStack } from "../lib/cert-stack";

describe("Certificate", () => {
  const app = new cdk.App();

  const stack = new CertStack(app, "MyTestStack", {
    env: {
      account: "1234567890",
      region: "us-east-1",
    },
    crossRegionReferences: true,
  });

  const template = Template.fromStack(stack);

  it("exists", () => {
    template.hasResourceProperties("AWS::CertificateManager::Certificate", {});
    template.resourceCountIs("AWS::CertificateManager::Certificate", 1);
  });
  it("certifies *.nourez.dev", () => {
    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      DomainName: "*.nourez.dev",
    });
  });
  it("also certifies nourez.dev and www.nourez.dev", () => {
    template.hasResourceProperties("AWS::CertificateManager::Certificate", {
      SubjectAlternativeNames: ["nourez.dev", "www.nourez.dev"],
    });
  });
});
