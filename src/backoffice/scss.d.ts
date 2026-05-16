declare module "*.module.scss" {
  const classes: { readonly [k: string]: string };
  export default classes;
}
declare module "*.scss";
declare module "*.css";
