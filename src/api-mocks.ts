export interface ApiMock {
  method: Method;
  url: string;
  status?: number;
  response: any;
  body?: any;
}

export enum Method {
  GET = 'get',
  POST = 'post',
}

export interface ApiMockRequestBuilder {
  method?: Method;
  url: string;
  body?: any;
}

export interface ApiMockResponseBuilder {
  status?: number;
  response: any;
}

export const createApiMock = ({
  method = Method.GET,
  url,
  body = null,
}: ApiMockRequestBuilder) => ({
  replyWith({ status = 200, response }: ApiMockResponseBuilder): ApiMock {
    return {
      method,
      url,
      response,
      body,
      status,
    };
  },
});
