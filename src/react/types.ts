export type AnyProps = Record<string, unknown> | null;


export type ReactComponentFunction = (
	props: AnyProps
) => ReactComponentInternalMetadata;


export type ReactComponentExternalMetadata<T extends AnyProps> = {
	component: keyof HTMLElementTagNameMap | ReactComponentFunction;
	props: T;
	children: Array<ReactComponentInternalMetadata | null | false | undefined>;
}


export type TagComponent = {
	kind: "tag";
	tagName: keyof HTMLElementTagNameMap;
	domRef: HTMLElement | null;
};


export type FunctionalComponent = {
	kind: "function";
	name: string;
	function: ReactComponentFunction;
};


export type RealElementReactComponentInternalMetadata = {
	kind: "real-element";
	component: TagComponent | FunctionalComponent;
	provider: null | Provider;
	props: AnyProps;
	children: Array<ReactComponentInternalMetadata>;
	// hooks: Array<ReactHookMetadata>;
	id: string;
};


export type EmptySlotReactComponentInternalMetadata = {
	kind: "empty-slot";
};


export type ReactComponentInternalMetadata =
	| RealElementReactComponentInternalMetadata
	| EmptySlotReactComponentInternalMetadata;



export type ReactRenderTreeNodeRealElement = {
	kind: "real-element";
	id: string;
	childNodes: Array<ReactRenderTreeNode>;
	computedViewTreeNodeId: string | null;
	internalMetadata: ReactComponentInternalMetadata;
	hooks: Array<
		UseStateMetadata | UseRefMetadata | UseEffectMetadata | UseMemoMetadata | UseContextMetadata
	>;
	indexPath: Array<number>;
	hasRendered: boolean; // im confident we don't need ths and can just derive this from existing info on the trees
	parent: ReactRenderTreeNode | null;
};

export type ReactRenderTreeNodeEmptySlot = {
	kind: "empty-slot";
	parent: ReactRenderTreeNode | null;
};

export type ReactRenderTreeNode = 
	| ReactRenderTreeNodeRealElement
	| ReactRenderTreeNodeEmptySlot


export type ReactRenderTree = {
	root: ReactRenderTreeNode;
	currentlyRendering: ReactRenderTreeNode | null;
	currentLocalHookOrder: number;
}


export type ReactViewTreeNodeRealElement = {
	kind: "real-element";
	id: string;
	childNodes: Array<ReactViewTreeNode>;
	metadata: ReactComponentInternalMetadata;
	indexPath: Array<number>; // allows for optimized diffs to know what to map with
	parent: ReactViewTreeNode | null;
};


export type ReactViewTreeNodeEmptySlot = {
	kind: "empty-slot";
	id: string;
	parent: ReactViewTreeNode | null;
};


export type ReactViewTreeNode =
	| ReactViewTreeNodeRealElement
	| ReactViewTreeNodeEmptySlot;


export type ReactViewTree = {
	root: ReactViewTreeNode | null;
};


export type UseStateMetadata = {
	kind: "state";
	value: unknown;
};

export type UseEffectMetadata = {
	kind: "effect";
	deps: Array<unknown>;
	cb: () => unknown;
	cleanup: (() => void) | null;
};
export type UseRefMetadata = {
	kind: "ref";
	refTo: { current: unknown };
};

export type Provider = {
	state: unknown;
	contextId: string;
};

export type UseContextMetadata = {
	kind: "context";
	refTo: { current: unknown };
};

export type UseMemoMetadata = {
	kind: "memo";
	memoizedValue: unknown;
	deps: Array<unknown>;
};