import { Component } from "../../core/component";
import ConfigurationComponent from "../../core/nested-option";
import { mount, React, shallow } from "./setup";
import {
    eventHandlers,
    fireOptionChange,
    TestComponent,
    Widget,
    WidgetClass
} from "./test-component";

interface IControlledComponentProps {
    defaultControlledOption?: string;
    controlledOption?: string;
    onControlledOptionChanged?: () => void;
    everyOption?: number;
    anotherOption?: string;
}

// tslint:disable:max-classes-per-file

class ControlledComponent extends TestComponent<IControlledComponentProps> {

    protected _defaults = {
        defaultControlledOption: "controlledOption"
    };
}

class NestedComponent extends ConfigurationComponent<{
    a?: number;
    b?: string;
    c?: string;
    defaultC?: string;
}> {

    public static DefaultsProps = {
        defaultC: "c"
    };
}

(NestedComponent as any).OptionName = "nestedOption";

class CollectionNestedComponent extends ConfigurationComponent<{ a?: number; }> { }
(CollectionNestedComponent as any).OptionName = "items";
(CollectionNestedComponent as any).ExpectedChildren = {
    subItems: {
        optionName: "subItems",
        isCollectionItem: true
    }
};

class CollectionSubNestedComponent extends ConfigurationComponent<{ a?: number; }> { }
(CollectionSubNestedComponent as any).OptionName = "subItems";

class TestComponentWithExpectation<P = any> extends Component<P> {

    protected _expectedChildren = {
        items: {
            optionName: "items",
            isCollectionItem: true
        }
    };

    protected _WidgetClass = WidgetClass;
}

describe("option update", () => {

    it("calls option method on props update", () => {
        const component = mount(
            <TestComponent />
        );
        expect(Widget.option.mock.calls.length).toBe(0);

        component.mount();

        expect(Widget.option.mock.calls.length).toBe(0);

        const sampleProps = { text: "1" };
        component.setProps(sampleProps);

        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0][0]).toEqual("text");
        expect(Widget.option.mock.calls[0][1]).toEqual("1");
    });

    it("updates nested collection item", () => {
        const node = shallow(
            <TestComponentWithExpectation>
                <CollectionNestedComponent a={123}/>
            </TestComponentWithExpectation>
        );

        const nested = node
            .find(CollectionNestedComponent).dive();

        nested.setProps({ a: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["items[0].a", 234]);
    });

    it("updates sub-nested collection item", () => {
        const node = shallow(
            <TestComponentWithExpectation>
                <CollectionNestedComponent>
                    <CollectionSubNestedComponent a={123}/>
                </CollectionNestedComponent>
            </TestComponentWithExpectation>
        );

        const nested = node
            .find(CollectionNestedComponent).dive()
            .find(CollectionSubNestedComponent).dive();

        nested.setProps({ a: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["items[0].subItems[0].a", 234]);
    });

});

describe("option control", () => {

    it("binds callback for optionChanged", () => {
        shallow(
            <ControlledComponent everyOption={123} />
        );

        expect(eventHandlers).toHaveProperty("optionChanged");
    });

    describe("handler option", () => {

        it("is not fired when option changed on props updating", () => {
            const handler = jest.fn();
            const component = shallow(
                <ControlledComponent
                    controlledOption={"controlled"}
                    onControlledOptionChanged={handler}
                />
            );
            Widget.option.mockImplementation(
                (name: string) => {
                    if (name === "controlledOption") {
                        WidgetClass.mock.calls[0][1].onControlledOptionChanged();
                    }
                }
            );
            component.setProps({
                controlledOption: "changed"
            });

            expect(handler.mock.calls.length).toBe(0);

            Widget.option("controlledOption", "controlled");

            expect(handler.mock.calls.length).toBe(1);

        });

        it("is not fired when option changed on props updating (handler updated)", () => {
            const handler = jest.fn();
            const component = shallow(
                <ControlledComponent
                    controlledOption={"controlled"}
                    onControlledOptionChanged={jest.fn()}
                />
            );
            Widget.option.mockImplementation(
                (name: string) => {
                    if (name === "controlledOption") {
                        Widget.option.mock.calls[0][1]();
                    }
                }
            );

            component.setProps({
                onControlledOptionChanged: handler
            });

            component.setProps({
                controlledOption: "changed"
            });

            expect(handler.mock.calls.length).toBe(0);

            Widget.option("controlledOption", "controlled");

            expect(handler.mock.calls.length).toBe(1);
        });

        it("is not updated on other prop updating", () => {
            const controlledOptionChanged = jest.fn();
            const component = shallow(
                <ControlledComponent
                    anotherOption={"abc"}
                    onControlledOptionChanged={controlledOptionChanged}
                />
            );

            component.setProps({
                anotherOption: "def"
            });

            expect(Widget.option.mock.calls.length).toBe(1);
            expect(Widget.option.mock.calls[0]).toEqual(["anotherOption", "def"]);
        });
    });

    it("rolls option value back", () => {
        shallow(
            <ControlledComponent everyOption={123} />
        );

        fireOptionChange("everyOption", 234);
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["everyOption", 123]);
    });

    it("rolls option value back if value has no changes", () => {
        const component = shallow(
            <ControlledComponent everyOption={123} anotherOption={"const"} />
        );

        fireOptionChange("anotherOption", "changed");
        component.setProps({ everyOption: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(2);
        expect(Widget.option.mock.calls[0]).toEqual(["everyOption", 234]);
        expect(Widget.option.mock.calls[1]).toEqual(["anotherOption", "const"]);
    });

    it("apply option change if value really change", () => {
        const component = shallow(
            <ControlledComponent everyOption={123} />
        );

        fireOptionChange("everyOption", 234);
        component.setProps({ everyOption: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["everyOption", 234]);
    });

});

describe("option defaults control", () => {

    it("pass default values to widget", () => {
        shallow(
            <ControlledComponent defaultControlledOption={"default"} />
        );

        expect(WidgetClass.mock.calls[0][1].controlledOption).toBe("default");
        expect(WidgetClass.mock.calls[0][1]).not.toHaveProperty("defaultControlledOption");
    });

    it("ignores option with default prefix", () => {
        shallow(
            <ControlledComponent defaultControlledOption={"default"} />
        );

        fireOptionChange("controlledOption", "changed");
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

    it("ignores 3rd-party changes in default props", () => {
        const component = shallow(
            <ControlledComponent defaultControlledOption={"default"} />
        );
        component.setProps({
            defaultControlledOption: "changed"
        });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

});

describe("nested option control", () => {

    it("rolls nested option value back", () => {
        mount(
            <ControlledComponent>
                <NestedComponent a={123} />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption.a", 234);
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["nestedOption.a", 123]);
    });

    it("rolls nested option value if parent object changes another field", () => {
        mount(
            <ControlledComponent>
                <NestedComponent a={123} />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption", { b: "abc" });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["nestedOption.a", 123]);
    });

    it("rolls nested option value and preserves parent object", () => {
        mount(
            <ControlledComponent>
                <NestedComponent a={123} />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption", { a: 456, b: "abc" });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["nestedOption.a", 123]);
    });

    it("rolls nested option value back if value has no changes", () => {
        const component = shallow(
            <ControlledComponent>
                <NestedComponent a={123} b="const" />
            </ControlledComponent>
        );
        const nested = component.find(NestedComponent).dive();

        fireOptionChange("nestedOption.b", "changed");
        nested.setProps({ a: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(2);
        expect(Widget.option.mock.calls[0]).toEqual(["nestedOption.a", 234]);
        expect(Widget.option.mock.calls[1]).toEqual(["nestedOption.b", "const"]);
    });

    it("apply nested option change if value really change", () => {
        const component = shallow(
            <ControlledComponent>
                <NestedComponent a={123} b="const" />
            </ControlledComponent>
        );
        const nested = component.find(NestedComponent).dive();

        fireOptionChange("nestedOption.a", 234);
        nested.setProps({ a: 234 });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0]).toEqual(["nestedOption.a", 234]);
    });

    it("does not control not specified nested option", () => {
        shallow(
            <ControlledComponent>
                <NestedComponent a={123} />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption.b", "abc");
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

});

describe("nested option defaults control", () => {

    it("pass nested default values to widget", () => {
        mount(
            <ControlledComponent>
                <NestedComponent defaultC="default" />
            </ControlledComponent>
        );

        expect(WidgetClass.mock.calls[0][1].nestedOption.c).toBe("default");
        expect(WidgetClass.mock.calls[0][1].nestedOption).not.toHaveProperty("defaultC");
    });

    it("does not pass default values to widget if controlledOption set", () => {
        shallow(
            <ControlledComponent defaultControlledOption={"default"} controlledOption={"controlled"} />
        );

        expect(Widget.option.mock.calls.length).toBe(0);
        expect(WidgetClass.mock.calls[0][1].controlledOption).toBe("controlled");
        expect(WidgetClass.mock.calls[0][1]).not.toHaveProperty("defaultControlledOption");
    });

    it("ignores nested option with default prefix", () => {
        mount(
            <ControlledComponent>
                <NestedComponent defaultC="default" />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption.c", "changed");
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

    it("ignores 3rd-party changes in nested default props", () => {
        const component = shallow(
            <ControlledComponent>
                <NestedComponent defaultC="default" />
            </ControlledComponent>

        );
        const nested = component.find(NestedComponent).dive();

        nested.setProps({
            defaultC: "changed"
        });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

    it("ignores 3rd-party changes in nested default props if parent object changes", () => {
        mount(
            <ControlledComponent>
                <NestedComponent defaultC="default" />
            </ControlledComponent>
        );

        fireOptionChange("nestedOption", { a: 456, b: "abc" });
        jest.runAllTimers();
        expect(Widget.option.mock.calls.length).toBe(0);
    });

    it("does not pass nested default values to widget if controlledOption set", () => {
        mount(
            <ControlledComponent>
                <NestedComponent defaultC="default" c="controlled" />
            </ControlledComponent>
        );

        expect(Widget.option.mock.calls.length).toBe(0);
        expect(WidgetClass.mock.calls[0][1].nestedOption.c).toBe("controlled");
        expect(WidgetClass.mock.calls[0][1].nestedOption).not.toHaveProperty("defaultC");
    });

});

describe("mutation detection", () => {

    it("prevents update if no option changed", () => {
        const component = shallow(
            <TestComponent prop="abc" />
        );

        component.setProps({ prop: "abc" });

        expectNoPropsUpdate();
    });

    it("prevents update if array-option mutated", () => {
        const arr = [1, 2, 3];
        const component = shallow(
            <TestComponent prop={arr} />
        );

        arr[0] = 123;
        component.setProps({ prop: arr });

        expectNoPropsUpdate();
    });

    it("prevents update if object-option mutated", () => {
        const obj = {
            field: 123
        };
        const component = shallow(
            <TestComponent prop={obj} />
        );

        obj.field = 456;
        component.setProps({ prop: obj });

        expectNoPropsUpdate();
    });

    it("triggers update if object-option replaced", () => {
        const component = shallow(
            <TestComponent prop={[1, 2, 3]} />
        );

        component.setProps({ prop: [1, 2, 3, 4] });

        expectPropsUpdated("prop", [1, 2, 3, 4]);
    });

    it("triggers update if option added", () => {
        const component = shallow(
            <TestComponent prop="123" />
        );

        component.setProps({ anotherProp: 456 });

        expectPropsUpdated("anotherProp", 456);
    });

    const expectNoPropsUpdate = () => {
        expect(Widget.option.mock.calls.length).toBe(0);
        expect(Widget.beginUpdate.mock.calls.length).toBe(0);
        expect(Widget.endUpdate.mock.calls.length).toBe(0);
    };

    const expectPropsUpdated = (expectedPath: string, value: any) => {
        expect(Widget.option.mock.calls.length).toBe(1);
        expect(Widget.beginUpdate.mock.calls.length).toBe(1);
        expect(Widget.endUpdate.mock.calls.length).toBe(1);
        expect(Widget.option.mock.calls[0][0]).toEqual(expectedPath);
        expect(Widget.option.mock.calls[0][1]).toEqual(value);
    };
});
