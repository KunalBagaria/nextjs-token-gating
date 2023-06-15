import { NextApiRequest, NextApiResponse } from "next";
import { checkToken } from "./checkToken";

async function gateMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  apiKey: string,
  projectId: string,
  mintId: string,
  next: Function
) {
  const customerId = req.headers['CUSTOMER-ID'] as string;
  if (!customerId) {
    const ERROR_DETAILS = "Missing Holaplex Customer ID in Request";
    res.status(400).send(ERROR_DETAILS);
    next(new Error(ERROR_DETAILS));
  } else {
    // check whether the customer holds the particular token.
    const customerOwnsToken = await checkToken(apiKey, mintId, projectId, customerId);
    if (customerOwnsToken instanceof Error) {
      const ERROR_DETAILS = "Error while checking token";
      res.status(500).send(ERROR_DETAILS);
      next(new Error(ERROR_DETAILS));
    }
    if (customerOwnsToken === false) {
      const ERROR_DETAILS = "Customer does not own the token";
      res.status(401).send(ERROR_DETAILS);
      next(new Error(ERROR_DETAILS));
    }
    next("Success");
  }
}

// Define a higher-order function that takes an API route handler and returns a new handler with the middleware applied
export function withTokenGating(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  apiKey: string,
  projectId: string,
  mintId: string
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // We're using a Promise here to allow for async middleware
    await new Promise(async (resolve, reject) => {
      await gateMiddleware(req, res, apiKey, projectId, mintId, (result: any) => {
        // If the middleware calls next() with an error, reject the promise with that error
        if (result instanceof Error) {
          return reject(result);
        }
        // Otherwise, resolve the promise
        return resolve(result);
      });
    });

    // If we've made it here, the middleware did not send an error, so we can call the original handler
    return handler(req, res);
  };
}