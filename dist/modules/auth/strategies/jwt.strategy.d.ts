import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../common/interfaces';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): Promise<{
        userId: string;
        username: string;
        role: import("../../../common/interfaces").UserRole;
    }>;
}
export {};
