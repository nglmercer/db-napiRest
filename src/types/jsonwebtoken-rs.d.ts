declare module "jsonwebtoken-rs" {
  interface JwtPayload {
    sub: string;
    [key: string]: any;
  }

  export function sign(payload: string | object | Buffer, secretOrPrivateKey: string | Buffer, options?: object): string;
  export function verify(token: string, secretOrPublicKey: string | Buffer, options?: object): JwtPayload | string;
  export function decode(token: string, options?: object): null | JwtPayload | string;
}
