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
	// provider: null | Provider;
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
