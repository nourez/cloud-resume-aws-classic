import json
import logging
import boto3
from custom_encoder import CustomEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DYNAMO_TABLE = "cloud-resume-table"
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DYNAMO_TABLE)

get_method = "GET"
post_method = "POST"
page_path = "/page"
pages_path = "/pages"


def lambda_handler(event, context):
    logger.info(event)
    http_method = event["httpMethod"]
    path = event["path"]

    if path == page_path:
        if http_method == get_method:
            response = get_hit_count(event["queryStringParameters"]["page"])
            return response
        elif http_method == post_method:
            response = increment_hit_count(event["queryStringParameters"]["page"])
            return response
        else:
            return response_builder(404)
    elif path == pages_path:
        if http_method == get_method:
            response = get_pages()
            return response
        else:
            return response_builder(404)
    else:
        return response_builder(404)


# CRUD Methods
def get_hit_count(page):
    try:
        hits = table.get_item(Key={"page": page})
        response = response_builder(200, hits["Item"]["hits"])

    except Exception as exception:
        print(exception)
        response = response_builder(500, "Internal Server Error")

    return response


def increment_hit_count(page):
    try:
        if not page_exists(page):
            table.put_item(Item={"page": page, "hits": 1})
        else:
            table.update_item(
                Key={"page": page},
                UpdateExpression="set hits = hits + :val",
                ExpressionAttributeValues={":val": 1},
                ReturnValues="UPDATED_NEW",
            )

        hits = table.get_item(Key={"page": page})
        response = response_builder(
            200,
            {
                "Action": "Increment",
                "Status": "Success",
                "Page": page,
                "hits": hits["Item"]["hits"],
            },
        )

    except Exception as exception:
        print(exception)
        response = response_builder(500, "Internal Server Error")

    return response


def get_pages():
    try:
        scan_results = table.scan()
        data = scan_results["Items"]

        while "LastEvaluatedKey" in scan_results:
            scan_results = table.scan(
                ExclusiveStartKey=scan_results["LastEvaluatedKey"]
            )
            data.extend(scan_results["Items"])

        response = response_builder(200, data)

    except Exception as exception:
        print(exception)
        response = response_builder(500, "Internal Server Error")

    return response


# Helper Methods
def response_builder(status_code, body=None):
    response = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    }

    if body is not None:
        response["body"] = json.dumps(body, cls=CustomEncoder)

    return response


def page_exists(page):
    try:
        hits = table.get_item(Key={"page": page})
        if "Item" in hits:
            return True
        else:
            return False

    except Exception as exception:
        print(exception)
        return False
