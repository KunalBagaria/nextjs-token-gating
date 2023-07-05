import { NextApiRequest, NextApiResponse } from "next";
import { checkToken } from "./checkToken";
import { getUserIdFromSession } from "./getUserIdFromSession";

async function gateMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  apiKey: string,
  projectId: string,
  collectionId: string,
  next: Function,
  customerIdThroughParam?: string,
) {
  if (customerIdThroughParam) {
    const customerOwnsToken = await checkToken(apiKey, collectionId, projectId, customerIdThroughParam);
    if (customerOwnsToken instanceof Error) {
      const ERROR_DETAILS = "Error while checking token";
      res.status(500).send({ error: ERROR_DETAILS });
      next(new Error(ERROR_DETAILS));
    }
    if (customerOwnsToken === false) {
      const ERROR_DETAILS = "Customer does not own the token";
      res.status(401).send({ error: ERROR_DETAILS });
      next(new Error(ERROR_DETAILS));
    }
    next("Success");
    return;
  }
  const customerId = req.headers['customer-id'] as string;
  if (!customerId) {
    const ERROR_DETAILS = "Missing Holaplex Customer ID in Request";
    res.status(400).send({ error: ERROR_DETAILS });
    next(new Error(ERROR_DETAILS));
  } else {
    // check whether the customer holds the particular token.
    const customerOwnsToken = await checkToken(apiKey, collectionId, projectId, customerId);
    if (customerOwnsToken instanceof Error) {
      const ERROR_DETAILS = "Error while checking token";
      res.status(500).send({ error: ERROR_DETAILS });
      next(new Error(ERROR_DETAILS));
    }
    if (customerOwnsToken === false) {
      const ERROR_DETAILS = "Customer does not own the token";
      res.status(401).send({ error: ERROR_DETAILS });
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
  collectionId: string,
  customerId?: string
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // We're using a Promise here to allow for async middleware
      await new Promise(async (resolve, reject) => {
        const session =
        await gateMiddleware(req, res, apiKey, projectId, collectionId, (result: any) => {
          // If the middleware calls next() with an error, reject the promise with that error
          if (result instanceof Error) {
            return reject(result);
          }
          // Otherwise, resolve the promise
          return resolve(result);
        }, customerId);
      });
      // If we've made it here, the middleware did not send an error, so we can call the original handler
      return handler(req, res);
    } catch (e) {
      // do nothing
    }
  };
}

export function withTokenAndSessionGating(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  apiKey: string,
  projectId: string,
  collectionId: string,
  fetchCustomerIdCallback: (userId: string) => Promise<string>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // We're using a Promise here to allow for async middleware
      await new Promise(async (resolve, reject) => {
        const userId = await getUserIdFromSession(req, res);
        if (!userId) {
          const ERROR_DETAILS = "Missing Session Details";
          return reject(new Error(ERROR_DETAILS));
        }
        const customerID = await fetchCustomerIdCallback(userId);
        if (typeof customerID !== 'string') {
          const ERROR_DETAILS = "No Customer ID supplied for the user";
          return reject(new Error(ERROR_DETAILS));
        }
        await gateMiddleware(req, res, apiKey, projectId, collectionId, (result: any) => {
          // If the middleware calls next() with an error, reject the promise with that error
          if (result instanceof Error) {
            return reject(result);
          }
          // Otherwise, resolve the promise
          return resolve(result);
        }, customerID);
      });
      // If we've made it here, the middleware did not send an error, so we can call the original handler
      return handler(req, res);
    } catch (e) {
      // do nothing
    }
  };
}