import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class CertStack extends cdk.Stack {
  public readonly cert: acm.Certificate;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.cert = new acm.Certificate(this, "ResumeCert", {
      certificateName: "CloudResumeCert",
      domainName: "*.nourez.dev",
      subjectAlternativeNames: ["nourez.dev", "www.nourez.dev"],
      validation: acm.CertificateValidation.fromDns(),
    });
  }
}
