export interface ApiMock {
  method: Method;
  url: string;
  query?: any;
  status?: number;
  response: any;
  body?: any;
}

export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

export interface ApiMockRequestBuilder {
  method?: Method;
  url: string;
  query?: any;
  body?: any;
}

export interface ApiMockResponseBuilder {
  status?: number;
  response: any;
}

export const createApiMock = ({
  method = Method.GET,
  url,
  query,
  body,
}: ApiMockRequestBuilder) => ({
  replyWith({ status = 200, response }: ApiMockResponseBuilder): ApiMock {
    return {
      method,
      url,
      query,
      response,
      body,
      status,
    };
  },
});
