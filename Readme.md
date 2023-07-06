# Holaplex Token Gating Middleware for Next.js

This software development kit (SDK) provides middleware for Next.js API routes that gates access based on whether a customer holds a specific token. This is particularly useful in scenarios where you want to restrict access to specific routes for users who hold a certain drop.

## Overview

The main function of this SDK is the `withTokenGating` higher-order function, which takes an API route handler and applies a middleware to it. This middleware will check if the requester owns a specific token, and if not, it will prevent further processing of the request.

## How it Works

This SDK uses the Holaplex API to check if a given customer holds a specific token. The `checkToken` function sends a GraphQL query to the Holaplex API requesting the tokens associated with the specified customer and project. It then checks if the desired token (`collectionId`) is in that list.

## Usage

---
If you want to supply Customer ID manually:
---

First, import the `withTokenGating` function and apply it to your Next.js API route handlers like so:

```ts
import { withTokenGating } from "@holaplex/nextjs-token-gating";

// Define your handler
const handler = (req, res) => {
  res.status(200).send("You own the token, welcome!");
};

// Apply the middleware
export default withTokenGating(
  handler,
  YOUR_HOLAPLEX_API_KEY,
  YOUR_PROJECT_ID,
  COLLECTION_ID,
  CUSTOMER_ID // optional
);
```

The withTokenGating function takes four arguments:

1. The original API route handler function (it should be a function accepting NextApiRequest and NextApiResponse as arguments).
2. Your Holaplex API Key.
3. Your project ID.
4. The mint ID of the token you want to check ownership of.
5. The customer ID (optional).


When a request is made to the route, the middleware will first check if a customer ID is provided as a parameter to `withTokenGating`. If it is, it will use this customer ID to check for token ownership. If not, it will attempt to extract the customer ID from the request headers (`customer-id` header).

If the customer ID is neither provided as a parameter nor found in the headers, the middleware will return a 400 status with a "Missing Holaplex Customer ID in Request" error.

---
If you want the middleware to extract the customer id through next-auth and your database:
---

First, import the `withTokenAndSessionGating` function and apply it to your Next.js API route handlers like so:

```ts
import prisma from '@/lib/db';
import { withTokenAndSessionGating } from "@holaplex/nextjs-token-gating";

// Define your handler
const handler = (req, res) => {
  res.status(200).send("You own the token, welcome!");
};

// Example of a callback function to get Customer ID from your database
async function fetchCustomerIdCallback(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId }
  });
  return user.customerId
}

// Apply the middleware
export default withTokenAndSessionGating(
  handler,
  YOUR_HOLAPLEX_API_KEY,
  YOUR_PROJECT_ID,
  COLLECTION_ID,
  fetchCustomerIdCallback // function that takes user id (obtained from next-auth session) as an arg and returns customer id
);
```

**Please note that `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` must be available as environment variables for this to work.**

The `withTokenAndSessionGating` function takes the previous four arguments, with the modification of the fifth argument that takes in a function instead of a customer ID. This function should take the User ID as an argument (which the middleware automatically fetches from the session and supplies it to this function) and return the customer ID from your database.

Once the customer ID is obtained, the middleware checks if the customer owns the specified token. If they don't, it will return a 401 status with a "Customer does not own the token" error. If there's an error while checking for the token, a 500 status with an "Error while checking token" error is returned.

If everything checks out, the middleware calls the original handler function and processing of the request continues as normal.


## Installation

```
yarn add @holaplex/nextjs-token-gating
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
