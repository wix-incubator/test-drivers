import { ApiMock } from '../api-mocks';

export interface FullTestDriverConfig<Environment> {
  wrapWith(environment: Environment): (componentToWrap: any) => any;
  getInitialEnvironment(): Environment;
  getDefaultApiMocks(): ApiMock[];
  applyMocks(mocks: ApiMock[], environment: Environment): void;
}

export interface TestDriverConfig<Environment = {}>
  extends Partial<FullTestDriverConfig<Environment>> {}

export const getDefaultConfig: FullTestDriverConfig<any> = {
  wrapWith() {
    return (componentToWrap: any) => componentToWrap;
  },
  getInitialEnvironment(): {} {
    return {};
  },
  getDefaultApiMocks(): ApiMock[] {
    return [];
  },
  applyMocks() {},
};
