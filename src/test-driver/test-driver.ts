import { configure, mount, ReactWrapper } from 'enzyme';
import React16Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { ApiMock } from '../api-mocks';
import { applyChanges, byDataHook } from '../utils';
import {
  TestDriverConfig,
  FullTestDriverConfig,
  getDefaultConfig,
} from './test-driver-config';

configure({ adapter: new React16Adapter() });

export declare class ITestDriver<Props, Environment> {
  constructor(component?: ReactWrapper);
  givenProp<T extends keyof Props>(
    key: T,
    value: Props[T],
  ): ITestDriver<Props, Environment>;
  getProp<T extends keyof Props>(key: T): Props[T];
  givenEnv<T extends keyof Environment>(
    key: T,
    value: Environment[T],
  ): ITestDriver<Props, Environment>;
  getEnv<T extends keyof Environment>(key: T): Environment[T];
  givenApiMock(apiMock: ApiMock): ITestDriver<Props, Environment>;
  render(
    component: React.ComponentType<Props>,
    options?: { attachToDOM: false },
  ): Promise<ITestDriver<Props, Environment>>;
  getByDataHook(hook: string, component?: ReactWrapper): ReactWrapper;
  cleanup(): ITestDriver<Props, Environment>;
  exists(): boolean;
  update(): Promise<ITestDriver<Props, Environment>>;
}

export const createTestDriver = <Environment = {}>(
  testDriverConfig?: TestDriverConfig<Environment>,
) => {
  const driverConfig: FullTestDriverConfig<Environment> = {
    ...getDefaultConfig,
    ...testDriverConfig,
  };

  return class TestDriver<Props = {}>
    implements ITestDriver<Props, Environment> {
    component: ReactWrapper;
    componentData: Props;
    environment: Environment;
    apiMocks: ApiMock[];
    isRendered: boolean;
    attachedToDOM: boolean;

    constructor(component?) {
      this.component = component;

      this.componentData = {} as Props;
      this.environment = driverConfig.getInitialEnvironment();
      this.apiMocks = driverConfig.getDefaultApiMocks();
      this.isRendered = false;
      this.attachedToDOM = false;
    }

    givenProp<T extends keyof Props>(key: T, value: Props[T]) {
      this.componentData[key] = value;
      return this;
    }

    getProp<T extends keyof Props>(key: T): Props[T] {
      return this.componentData[key];
    }

    givenEnv<T extends keyof Environment>(key: T, value: Environment[T]) {
      this.environment[key] = value;
      return this;
    }

    getEnv<T extends keyof Environment>(key: T): Environment[T] {
      return this.environment[key];
    }

    givenApiMock(apiMock: ApiMock) {
      this.apiMocks.push(apiMock);

      if (this.isRendered) {
        this.applyApiMocks();
      }

      return this;
    }

    applyApiMocks() {
      driverConfig.applyMocks(this.apiMocks, this.environment);
      return this;
    }

    async render(
      component: React.ComponentType<Props>,
      options = { attachToDOM: false },
    ) {
      this.isRendered = true;
      this.attachedToDOM = options.attachToDOM;

      const element = React.createElement(component, this.componentData);
      const wrappedComponent = driverConfig.wrapWith(this.environment)(element);

      this.applyApiMocks();

      this.component = mount(wrappedComponent, {
        attachTo: options.attachToDOM
          ? document.body.appendChild(document.createElement('div'))
          : undefined,
      });

      await this.update();

      return this;
    }

    getByDataHook(
      hook: string,
      component: ReactWrapper = this.component,
    ): ReactWrapper {
      return component.find(byDataHook(hook));
    }

    cleanup() {
      if (!this.component) {
        return this;
      }

      if (this.attachedToDOM) {
        const parentElement = this.component.getDOMNode().parentElement;
        this.component.detach();
        parentElement && parentElement.remove();
      } else {
        this.component.unmount();
      }

      return this;
    }

    exists() {
      return this.component.exists();
    }

    async update() {
      await applyChanges();
      this.component.update();
      return this;
    }
  };
};
