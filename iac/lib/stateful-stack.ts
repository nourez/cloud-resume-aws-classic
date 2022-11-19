import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

interface StatefulStackProps extends cdk.StackProps {
  readonly isProduction: boolean;
}

export class StatefulStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatefulStackProps) {
    super(scope, id, props);

    // Create a DynamoDB table for hit counts
    const ResumeTable = new dynamodb.Table(this, "CloudResumeTable", {
      tableName: "cloud-resume-table",
      partitionKey: { name: "page", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
      removalPolicy: props.isProduction
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });
  }
}
