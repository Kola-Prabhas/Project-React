import type {
	AnyProps,
	ReactComponentExternalMetadata,
	ReactComponentInternalMetadata,
	RealElementReactComponentInternalMetadata
} from "./types";


function mapComponentToTaggedUnion(
	component: ReactComponentExternalMetadata<AnyProps>["component"]
): RealElementReactComponentInternalMetadata["component"] {
	return typeof component === "string"
		? { kind: "tag", tagName: component, domRef: null }
		: { kind: "function", function: component, name: component.name };
}

function mapExternalMetadataToInternalMetadata({
	externalMetadata
}: {
	externalMetadata: ReactComponentExternalMetadata<AnyProps>
}): ReactComponentInternalMetadata {
	return {
		// provider: null,
		kind: "real-element",
		component: mapComponentToTaggedUnion(externalMetadata.component),
		children: externalMetadata.children.map(
			(child): ReactComponentInternalMetadata => {
				const slotNode: ReactComponentInternalMetadata = {
					kind: "empty-slot",
				};
				if (!child) {
					return slotNode;
				}

				if (child.kind === "empty-slot") {
					return slotNode;
				}

				return child;
			}
		),
		props: externalMetadata.props,
		id: crypto.randomUUID(),
	}
}

export function createElement<T extends AnyProps>(
	component: ReactComponentExternalMetadata<T>["component"],
	props: T,
	...children: Array<ReactComponentInternalMetadata | null | undefined | false>
): ReactComponentInternalMetadata {
	const internalMetadata = mapExternalMetadataToInternalMetadata({
		externalMetadata: {
			component,
			props,
			children
		}
	})

	return internalMetadata
}

