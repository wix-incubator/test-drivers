import React from 'react';
import { TestDriverConfig } from './test-driver-config';
import { createTestDriver } from './test-driver';
import { ApiMock, Method, createApiMock } from '../api-mocks';

const SimpleFunctionComponent: React.FC = () => (
  <span data-hook="child">Child</span>
);

describe('TestDriver', () => {
  it('should successfully render a simple component', async () => {
    const TestDriver = createTestDriver();
    const driver = new TestDriver();

    await driver.render(SimpleFunctionComponent);

    expect(driver.getByDataHook('child').exists()).toEqual(true);
    expect(driver.getByDataHook('child').text()).toEqual('Child');
  });

  it('should wrap component', async () => {
    const TestDriver = createTestDriver({
      wrapWith: () => (componentToWrap: any) => {
        return <div data-hook="wrapper">{componentToWrap}</div>;
      },
    });
    const driver = new TestDriver();

    await driver.render(SimpleFunctionComponent);

    expect(driver.getByDataHook('wrapper').exists()).toEqual(true);
    expect(driver.getByDataHook('child').exists()).toEqual(true);
    expect(driver.getByDataHook('wrapper').text()).toEqual('Child');
  });

  it('should provide props', async () => {
    interface TestCompProps {
      text: string;
    }
    const TestComp: React.FC<TestCompProps> = ({ text }) => (
      <div>
        <span data-hook="content">{text}</span>
      </div>
    );

    const TestDriver = createTestDriver();
    const driver = new TestDriver<TestCompProps>();

    await driver.givenProp('text', 'hello').render(TestComp);

    expect(driver.getProp('text')).toEqual('hello');
    expect(driver.getByDataHook('content').text()).toEqual('hello');
  });

  it('should have initial environment', async () => {
    interface Env {
      headerText: string;
    }
    const testDriverConfig: TestDriverConfig<Env> = {
      wrapWith(environment: Env) {
        return (componentToWrap: any) => {
          return (
            <div>
              <div data-hook="header">{environment.headerText}</div>
              <div>{componentToWrap}</div>
            </div>
          );
        };
      },
      getInitialEnvironment(): Env {
        return {
          headerText: 'Header!',
        };
      },
    };

    const TestDriver = createTestDriver(testDriverConfig);
    const driver = new TestDriver();

    await driver.render(SimpleFunctionComponent);

    expect(driver.getEnv('headerText')).toEqual('Header!');
    expect(driver.getByDataHook('header').text()).toEqual('Header!');
  });

  it('should have custom environment', async () => {
    interface Env {
      headerText: string;
    }
    const testDriverConfig: TestDriverConfig<Env> = {
      wrapWith(environment: Env) {
        return (componentToWrap: any) => {
          return (
            <div>
              <div data-hook="header">{environment.headerText}</div>
              <div>{componentToWrap}</div>
            </div>
          );
        };
      },
      getInitialEnvironment(): Env {
        return {
          headerText: 'Header!',
        };
      },
    };

    const TestDriver = createTestDriver(testDriverConfig);
    const driver = new TestDriver();

    driver.givenEnv('headerText', 'New Header!');
    await driver.render(SimpleFunctionComponent);

    expect(driver.getEnv('headerText')).toEqual('New Header!');
    expect(driver.getByDataHook('header').text()).toEqual('New Header!');
  });

  it('should unmount the component during cleanup', async () => {
    const unmounting = jest.fn();

    const TestDriver = createTestDriver();
    const driver = new TestDriver();

    class TestComp extends React.Component {
      componentWillUnmount() {
        unmounting();
      }
      render() {
        return <div />;
      }
    }
    await driver.render(TestComp);

    driver.cleanup();

    expect(unmounting).toHaveBeenCalled();
  });

  it('should clean the dom during cleanup if the component was attached to dom', async () => {
    const unmounting = jest.fn();

    const TestDriver = createTestDriver();
    const driver = new TestDriver();

    class TestComp extends React.Component {
      componentWillUnmount() {
        unmounting();
      }
      render() {
        return <div>Test Comp</div>;
      }
    }

    expect(document.body.children.length).toEqual(0);
    await driver.render(TestComp, { attachToDOM: true });
    expect(document.body.children.length).toEqual(1);

    driver.cleanup();

    expect(unmounting).toHaveBeenCalled();
    expect(document.body.children.length).toEqual(0);
  });

  it('should not throw if cleanup is called without a component', () => {
    const TestDriver = createTestDriver();
    const driver = new TestDriver();

    expect(() => driver.cleanup()).not.toThrow();
  });

  it('should assert whether a component exists', async () => {
    const TestDriver = createTestDriver();
    const driver = new TestDriver();

    await driver.render(SimpleFunctionComponent);
    const subDriver = new TestDriver(driver.getByDataHook('invalid-hook'));

    expect(driver.exists()).toEqual(true);
    expect(subDriver.exists()).toEqual(false);
  });

  it('should apply initial api mocks after render', async () => {
    const mocker = jest.fn();

    const testDriverConfig: TestDriverConfig = {
      applyMocks(mocks: ApiMock[]) {
        mocks.forEach(mock => mocker(mock));
      },
    };
    const TestDriver = createTestDriver(testDriverConfig);
    const driver = new TestDriver();

    const getSettingsMock = createApiMock({
      method: Method.GET,
      url: '/api/settings',
    }).replyWith({ response: 'ok' });
    driver.givenApiMock(getSettingsMock);

    await driver.render(SimpleFunctionComponent);

    expect(mocker).toHaveBeenCalledWith(getSettingsMock);
  });

  it('should apply api mocks immediately if already rendered', async () => {
    const mocker = jest.fn();

    const testDriverConfig: TestDriverConfig = {
      applyMocks(mocks: ApiMock[]) {
        mocks.forEach(mock => mocker(mock));
      },
    };
    const TestDriver = createTestDriver(testDriverConfig);
    const driver = new TestDriver();

    await driver.render(SimpleFunctionComponent);

    const getUpdatedSettingsMock = createApiMock({
      method: Method.GET,
      url: '/api/settings',
    }).replyWith({ response: 'ok' });
    driver.givenApiMock(getUpdatedSettingsMock);

    expect(mocker).toHaveBeenCalledWith(getUpdatedSettingsMock);
  });

  it('should be possible to extend TestDriver', async () => {
    const TestDriver = createTestDriver();

    interface TestCompProps {
      text: string;
    }
    const TestComp: React.FC<TestCompProps> = ({ text }) => (
      <div>
        <span data-hook="content">{text}</span>
      </div>
    );

    class TestCompDriver extends TestDriver<TestCompProps> {
      when = {
        created: () => this.render(TestComp),
      };

      get = {
        content: () => this.getByDataHook('content').text(),
      };
    }

    const testCompDriver = new TestCompDriver();
    await testCompDriver.givenProp('text', 'hello world').when.created();

    expect(testCompDriver.get.content()).toEqual('hello world');
  });
});