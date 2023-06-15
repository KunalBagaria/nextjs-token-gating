import axios, { AxiosResponse } from 'axios';

interface Data {
  project: Project;
}

interface Project {
  customer: Customer;
}

interface Customer {
  mints: Mint[] | null;
}

interface Mint {
  id: string;
}

async function fetchMints(
  apiKey: string,
  projectId: string,
  customerId: string,
  apiUrl: string = 'https://api.holaplex.com/graphql'
): Promise<AxiosResponse<Data>> {
  return axios.post<Data>(
    apiUrl,
    {
      query: `
        {
          project(id:"${projectId}") {
            customer(id:"${customerId}") {
              mints {
                id
              }
            }
          }
        }
      `,
    },
    {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Connection: 'keep-alive',
        DNT: 1,
        Origin: 'file://',
        Authorization: apiKey,
      },
    }
  );
}

async function checkToken(
  apiKey: string,
  mintId: string,
  projectId: string,
  customerId: string,
  apiUrl?: string
) {
  try {
    const { data } = await fetchMints(apiKey, projectId, customerId, apiUrl);
    const mints = data.project.customer.mints;
    if (mints) {
      return mints.some((mint) => mint.id === mintId);
    }
    return false;
  } catch (e: any) {
    console.log(e);
    return new Error(e);
  }
}

export { checkToken };