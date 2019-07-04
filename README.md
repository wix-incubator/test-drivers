# TestDrivers

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://travis-ci.org/wix-incubator/test-drivers.svg)](https://travis-ci.org/wix-incubator/test-drivers)
[![npm version](https://img.shields.io/npm/v/test-drivers.svg)](https://www.npmjs.com/package/test-drivers)

Test Drivers is a small library aimed to help developers write better tests more easily.

It's a small concept that makes a huge difference.

## Overview

### What are Test Drivers?
Test Drivers help developers separate between their tests - which should ideally reflect the requirements of their application, and the implementation - which is usually not crucial to know within the tests context and is probably gonna change over time - making the tests a high-maintenance job and full of inconsistencies and code that will end up being "magic".

Test Drivers should contain and abstract all the interaction with the components (clicking, reading data, etc) and expose a user-friendly api that is easy-to-use, simple and speaks the product language. Tests use Test Drivers to interact with the component-under-test, without being aware of its implementation details.

### What are the benefits?
By utilizing Test Drivers - developers should be able to write tests more easily, understand tests more easily and modify existing tests more easily. Sounds like a really basic and reasonable need - but in reality, sometimes becomes a real challenge on a big project with multiple developers.

Moreover, Test Drivers (referring to this specific library now) provides developers with best-practices we've developed over the past few years practicing this methodology, so you won't have to re-learn or implement them by yourself. We've got you covered.

### Who can use it?
The "Test Drivers" concept can be applied for multiple different use-cases. We've been practicing it mostly in front-end and UI-based applications but it's not limited to it.

This library provides a working implementation of the concept for applications written in React and is uses Enzyme internally, but as said before - the concept is framework-agnostic and can be implemented for other technologies as well.

Want us to add support for X? let us know!

### How do I use it?

Let's say you have the following component:
```jsx harmony
// user-avatar.js
const UserAvatar = ({ userName, imageUrl, isPremium }) => (
  <div>
    {isPremium && <img src="/assets/premium-badge.png" alt="Premium" />}
    <img src={imageUrl} alt={`${userName}'s profile image`} />}
    <span>{userName}</span>
  </div>
);
```
Your tests, shall probably look something like this:
```jsx harmony
// user-avatar.spec.js
describe('<UserAvatar />', () => {

  it('should show the user name', () => {
    const userName = 'user-name';
    const component = mount(<UserAvatar userName={userName} />);
    expect(component.find('span').text()).toEqual(userName);
  });

  it('should show the user image', () => {
    const imageUrl = 'http://example.com/image.png';
    const component = mount(<UserAvatar imageUrl={imageUrl} />);
    expect(component.find('img').prop('src')).toEqual(imageUrl);
  });

  // ...
});
```

Those tests however, although testing a really simple component, are highly fragile:
1. They are highly coupled to the component implementation. Almost every significant change in the component will require in changing the tests as well.
2. They cannot be re-used. Let's say we want to use the `<UserAvatar />` component elsewhere in our system, we cannot use those tests (as in testing the actual render output) without intimately knowing those selectors and duplicating them, so we'll probably end up testing the component's props and assert that we passed the correct props to the component. While it might work great at the time of writing the tests, it's very fragile and will result in "passing tests but broken implementation" once someone will change the component props or implementation but won't update all the usages of it across the system.
3. They aren't speaking the product language. Reading those tests doesn't really tells a story, the test titles are great, tho, but their content is highly technical and requires to know the implementation intimately in order to understand it.
4. They doesn't scale. Let's say we introduce a change that removes the surrounding spaces from the user name, so we add `userName.trim()` somewhere in our component's code. Now, although all our tests passed before without us needed to pass a `userName` where we didn't assert for it - we must pass it now or otherwise it will throw as `userName` is undefined there. So we need to manually add `userName` everywhere now.

Using the "Test Drivers" approach, you can write those tests as follows:
```jsx harmony
// user-avatar.driver.js
export class UserAvatarDriver extends TestDriver {
  get = {
    userName: () => this.component.find('span').text(),
    image: () => this.component.find('img').prop('src'),
  };

  when = {
    created: () => this.render(UserAvatar),
  };
}
```
```jsx harmony
// user-avatar.spec.js
describe('<UserAvatar />', () => {
  let driver;

  beforeEach(() => {
    driver = new UserAvatarDriver();
  });

  afterEach(() => {
    driver.cleanup();
  });

  it('should show the user name', async () => {
    const userName = 'user-name';
    await driver.givenProp('userName', userName).when.created();
    expect(driver.get.userName()).toEqual(userName);
  });

  it('should show the user image', async () => {
    const imageUrl = 'http://example.com/image.png';
    await driver.givenProp('imageUrl', imageUrl).when.created();
    expect(driver.get.image()).toEqual(imageUrl);
  });

  // ...
});
```

The new tests, utilizing the Test Driver, now speaks the product language and the component's external API and are decoupled from its implementation and do not require developers to intimately know the implementation in order to understand or modify them.

Cross-suite changes, like the one described in point 5, can be easily solved by changing the `beforeEach` to:
```jsx harmony
beforeEach(() => {
  driver = new UserAvatarDriver();
  driver.givenProp('userName', '');
});
```

## API

##### constructor(component?: ReactWrapper);
Test Drivers can mount their components internally via the `render` method, as was shown in the examples before, or can be applied on an already-mounted component - in cases when we nest Test Drivers and re-use them to interact with inner components. (TODO: "Constructor vs render") 

##### givenProp\<T extends keyof Props\>(key: T, value: Props[T]): TestDriver;
Sets a specific prop of the component with the given value.

##### getProp\<T extends keyof Props\>(key: T): Props[T];
Gets a specific prop of the component by its name.

##### givenEnv\<T extends keyof Environment\>(key: T, value: Environment[T]): TestDriver;
Sets an environment variable with the given value. (TODO: "What is Environment")

##### getEnv\<T extends keyof Environment\>(key: T): Environment[T];
Gets an environment variable by its name. (TODO: "What is Environment")

##### givenApiMock(apiMock: ApiMock): TestDriver;
Register a mock for a network request. (TODO: "Api Mocks explained")

##### render(component: React.ComponentType\<Props\>, options?: { attachToDOM: false }): Promise\<TestDriver\>;
Renders a component. Unless the component was passed in the `constructor`, this is the method we should call for our Test Driver to kick in.

##### getByDataHook(hook: string, component?: ReactWrapper): ReactWrapper;
A utility function used to select elements by data-hook instead of tag names/ ids/ clases. (TODO: "What are DataHooks")

##### cleanup(): TestDriver;
Cleans the rendered component from the memory nor the DOM. Should be called if we used the `render` method along our tests.

##### exists(): boolean;
A utility functions that checks whether the component exists.

##### update(): Promise\<TestDriver\>;
Runs an update cycle so our asynchronous tasks take effect.
