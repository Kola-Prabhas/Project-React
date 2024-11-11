function mapComponentToTaggedUnion(component) {
    return typeof component === "string"
        ? { kind: "tag", tagName: component, domRef: null }
        : { kind: "function", function: component, name: component.name };
}
function mapExternalMetadataToInternalMetadata({ externalMetadata }) {
    return {
        // provider: null,
        kind: "real-element",
        component: mapComponentToTaggedUnion(externalMetadata.component),
        children: externalMetadata.children.map((child) => {
            const slotNode = {
                kind: "empty-slot",
            };
            if (!child) {
                return slotNode;
            }
            if (child.kind === "empty-slot") {
                return slotNode;
            }
            return child;
        }),
        props: externalMetadata.props,
        id: crypto.randomUUID(),
    };
}
export function createElement(component, props, ...children) {
    const internalMetadata = mapExternalMetadataToInternalMetadata({
        externalMetadata: {
            component,
            props,
            children
        }
    });
    return internalMetadata;
}
