import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { Logging } from '@google-cloud/logging';
import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors({ origin: true }));

const logging = new Logging({
  projectId: process.env.GCLOUD_PROJECT,
});

export const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
});

export function reportError(err: any, context = {}) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.
  const logName = 'errors';
  const log = logging.log(logName);

  // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: {
        function_name: process.env.FUNCTION_NAME || 'unknown_function',
      },
    },
  };

  // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  const errorEvent = {
    message: err.stack,
    serviceContext: {
      service: process.env.FUNCTION_NAME,
      resourceType: 'cloud_function',
    },
    context: context,
  };

  // Write the error log entry
  return new Promise((resolve, reject) => {
    log.write(log.entry(metadata, errorEvent), (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// [END reporterror]

/**
 * Sanitize the error message for the user.
 */
export function userFacingMessage(error: any) {
  return error.type
    ? error.message
    : 'An error occurred, developers have been alerted';
}
