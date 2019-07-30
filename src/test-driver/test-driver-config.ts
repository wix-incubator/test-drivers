import { ApiMock } from '../api-mocks';
import { Hooks } from './test-driver';

export interface FullTestDriverConfig<Environment> {
  wrapWith(environment: Environment): (componentToWrap: any) => any;
  getInitialEnvironment(): Environment;
  getDefaultApiMocks(): ApiMock[];
  applyMocks(mocks: ApiMock[], environment: Environment): void;
  hooks: Hooks;
}

export interface TestDriverConfig<Environment = {}>
  extends Partial<FullTestDriverConfig<Environment>> {}
