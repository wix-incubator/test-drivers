import { configure, mount, ReactWrapper } from 'enzyme';
import React16Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';
import { ApiMock } from '../api-mocks';
import { applyChanges, byDataHook } from '../utils';
import { TestDriverConfig } from './test-driver-config';

configure({ adapter: new React16Adapter() });

export class TestDriver<Props = any, Environment = any> {
  component: ReactWrapper;
  componentData: Props;
  environment: Environment;
  apiMocks: ApiMock[];
  isRendered: boolean;
  attachedToDOM: boolean;

  constructor(component?) {
    this.component = component;

    this.componentData = {} as Props;
    this.environment = this.getInitialEnvironment();
    this.apiMocks = this.getDefaultApiMocks();
    this.isRendered = false;
    this.attachedToDOM = false;
  }

  wrapWith(environment: Environment) {
    return (
      componentToWrap: React.ReactElement<Props>,
    ): React.ReactElement<any> => componentToWrap;
  }

  getInitialEnvironment(): Environment {
    return {} as Environment;
  }

  getDefaultApiMocks(): ApiMock[] {
    return [];
  }

  applyMocks(mocks: ApiMock[], environment: Environment): void {
    // nothing
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

  givenApiMock(apiMock: ApiMock): this {
    this.apiMocks.push(apiMock);

    if (this.isRendered) {
      this.applyApiMocks();
    }

    return this;
  }

  applyApiMocks(): this {
    this.applyMocks(this.apiMocks, this.environment);
    return this;
  }

  async render(
    component: React.ComponentType<Props>,
    options = { attachToDOM: false },
  ): Promise<this> {
    this.isRendered = true;
    this.attachedToDOM = options.attachToDOM;

    const element = React.createElement(component, this.componentData);
    const wrappedComponent = this.wrapWith(this.environment)(element);

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

  cleanup(): this {
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

  exists(): boolean {
    return this.component.exists();
  }

  async update(): Promise<this> {
    await applyChanges();
    this.component.update();
    return this;
  }
}

export const createTestDriver = <Environment = any>(
  driverConfig?: TestDriverConfig<Environment>,
) => {
  return class ConfiguredTestDriver<Props = any> extends TestDriver<
    Props,
    Environment
  > {
    constructor(component?) {
      super(component);

      Object.assign(this, driverConfig);

      this.environment = this.getInitialEnvironment();
      this.apiMocks = this.getDefaultApiMocks();
    }
  };
};

// P = TestDriver Props
// E = TestDriver Environment
// M = ConsumerDriver Methods
export type ConsumerDriverFactory<P, E, M> = (
  driver: TestDriver<P, E>,
) => { [key in keyof M]: M[key] };

export const driverFactory = (_driver: typeof TestDriver = TestDriver) => {
  const initializedDriver: TestDriver = new _driver();
  return <P, E, M extends ReturnType<ConsumerDriverFactory<P, E, M>>>(
    consumerDriverFactory: ConsumerDriverFactory<P, E, M>,
  ): M & { _: TestDriver<P, E> } => {
    const consumerDriver = consumerDriverFactory(initializedDriver);
    return { _: initializedDriver, ...consumerDriver };
  };
};
