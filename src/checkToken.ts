interface Response {
  data: {
    project: Project;
  }
}

interface Project {
  customer: Customer;
}

interface Customer {
  mints: Mint[] | null;
}

interface Mint {
  collectionId: string;
}

async function fetchMints(
  apiKey: string,
  projectId: string,
  customerId: string,
  apiUrl: string = 'https://api.holaplex.com/graphql'
) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Connection: 'keep-alive',
      DNT: '1',
      Origin: 'file://',
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        {
          project(id:"${projectId}") {
            customer(id:"${customerId}") {
              mints {
                collectionId
              }
            }
          }
        }
      `,
    }),
  });

  return res.json() as Promise<Response>;  // add type assertion here
}

async function checkToken(
  apiKey: string,
  collectionId: string,
  projectId: string,
  customerId: string,
  apiUrl?: string
) {
  try {
    const response = await fetchMints(apiKey, projectId, customerId, apiUrl);
    const mints = response.data.project.customer.mints;
    if (mints) {
      return mints.some((mint) => mint.collectionId === collectionId);
    }
    return false;
  } catch (e: any) {
    console.log(e);
    return new Error(e);
  }
}

export { checkToken };