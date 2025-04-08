import type { VNode } from "./defineEntry";

export function jsx(tag: string, props: any, key?: any): VNode {
  return {
    tag,
    props,
    children: props?.children ? [props.children] : [],
  };
}

export function jsxs(tag: string, props: any, key?: any): VNode {
  return {
    tag,
    props,
    children: props?.children || [],
  };
}

export function jsxDEV(tag: string, props: any, key: any): VNode {
  return {
    tag,
    props,
    children: props?.children || [],
  };
}
