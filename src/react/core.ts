import type {
	AnyProps,
	ReactComponentExternalMetadata,
	ReactComponentInternalMetadata,
	RealElementReactComponentInternalMetadata,

	ReactRenderTreeNode,
	ReactRenderTree,
	ReactViewTreeNode,
	ReactViewTree,
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
}): RealElementReactComponentInternalMetadata {
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
): RealElementReactComponentInternalMetadata {
	const internalMetadata = mapExternalMetadataToInternalMetadata({
		externalMetadata: {
			component,
			props,
			children
		}
	})

	return internalMetadata
}


const currentTreeRef: {
	viewTree: ReactViewTree | null,
	renderTree: ReactRenderTree | null
} = {
	viewTree: null,
	renderTree: null
}


function generateReactTrees(
	renderNode: ReactRenderTreeNode,
	parentViewNode: ReactViewTreeNode | null
): { viewTree: ReactViewTreeNode } {

}


function buildReactTrees(
	internalMetadata: RealElementReactComponentInternalMetadata
): {
	viewTree: ReactViewTree,
	renderTree: ReactRenderTree
} {

	const rootRenderTreeNode: ReactRenderTreeNode = {
		id: crypto.randomUUID(),
		kind: "real-element",
		childNodes: [],
		computedViewTreeNodeId: null,
		internalMetadata: {
			id: crypto.randomUUID(),
			kind: 'real-element',
			component: {
				kind: 'function',
				function: () => internalMetadata,
				name: 'root'
			},
			children: [],
			props: {}
		},
		indexPath: [],
		hasRendered: false,
		parent: null
	}

	currentTreeRef.renderTree = {
		root: rootRenderTreeNode,
		currentLocalHookOrder: 0,
		currentlyRendering: null
	}

	console.log('------Rendering Start------');

	const { viewTree } = generateReactTrees(rootRenderTreeNode, null);

	currentTreeRef.viewTree = {
		root: viewTree
	}

	console.log('------Rendering End------');

	return {
		viewTree: currentTreeRef.viewTree,
		renderTree: currentTreeRef.renderTree
	}
}



export function render(
	internalMetadata: ReturnType<typeof createElement>,
	rootElement: HTMLElement
) {
	const { viewTree, renderTree } = buildReactTrees(internalMetadata);

	console.log('viewTree ', viewTree);
	console.log('renderTree ', renderTree);

	console.log('root element ', rootElement)

}
