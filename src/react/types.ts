export type AnyProps = Record<string, unknown> | null;

export type ReactComponentFunction = (
	props: AnyProps
) => ReactComponentInternalMetadata;

export type ReactComponentExternalMetadata<T extends AnyProps> = {
	component: keyof HTMLElementTagNameMap | ReactComponentFunction;
	props: T;
	children: Array<ReactComponentInternalMetadata | null | false | undefined>;
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

export type UseContextMetadata = {
	kind: "context";
	refTo: { current: unknown };
};

export type UseMemoMetadata = {
	kind: "memo";
	memoizedValue: unknown;
	deps: Array<unknown>;
};
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
	id: string;
};

export type EmptySlotReactComponentInternalMetadata = {
	kind: "empty-slot";
};
export type ReactComponentInternalMetadata =
	| RealElementReactComponentInternalMetadata
	| EmptySlotReactComponentInternalMetadata;



export type ReactViewTreeNodeRealElement = {
	kind: "real-element";
	id: string;
	childNodes: Array<ReactViewTreeNode>;
	metadata: ReactComponentInternalMetadata;
	indexPath: Array<number>; // allows for optimized diffs to know what to map with
	parent: ReactViewTreeNode | null;
};

export type Provider = {
	state: unknown;
	contextId: string;
};

export type ReactViewTreeNodeEmptySlot = {
	kind: "empty-slot";
	id: string;
	parent: ReactViewTreeNode | null;
};
export type ReactViewTreeNode =
	| ReactViewTreeNodeRealElement | ReactViewTreeNodeEmptySlot;

export type ReactViewTree = {
	root: ReactViewTreeNode | null;
};

export type CreateElementCallTreeNode = {
	order: number;
	childNodes: Array<CreateElementCallTreeNode>;
};
export type ReactRenderTree = {
	currentLastRenderChildNodes: Array<ReactRenderTreeNode>;
	currentlyRendering: ReactRenderTreeNode | null;
	currentLocalCurrentHookOrder: number;
	root: ReactRenderTreeNode;
};
export type RealElement = {
	kind: "real-element";
	id: string;
	childNodes: Array<ReactRenderTreeNode>;
	computedViewTreeNodeId: string | null;
	internalMetadata: ReactComponentInternalMetadata;
	hooks: Array<
		UseStateMetadata | UseRefMetadata | UseEffectMetadata | UseMemoMetadata
	>;
	indexPath: Array<number>;
	hasRendered: boolean;
};

export type EmptySlot = {
	kind: "empty-slot";
};
export type ReactRenderTreeNode = (RealElement | EmptySlot) & {
	parent: null | ReactRenderTreeNode;
};

