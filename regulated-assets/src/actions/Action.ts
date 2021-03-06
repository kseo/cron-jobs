import { H160, H256, PlatformAddress } from "codechain-primitives/lib";
import { Transaction } from "codechain-sdk/lib/core/classes";

import { State } from "../State";
import { TxSender } from "../TxSender";
import { assert, time } from "../util";

export abstract class Action<Tx extends Transaction> {
    public readonly tag: string;
    public readonly tx: Tx;
    public readonly sender: PlatformAddress;
    public readonly txSender: TxSender;

    protected constructor(params: { sender: PlatformAddress; tx: Tx; tag: string }) {
        this.tag = params.tag;
        this.tx = params.tx;
        this.sender = params.sender;
        this.txSender = new TxSender(params.sender, params.tx);
    }

    public async sendApply(state: State, expected?: boolean) {
        const valid = time("validate", () => this.valid(state));
        assert(() => valid === (expected == null ? true : expected), {
            valid,
            expected,
        });
        if (valid) {
            try {
                const hash = await time("send", () => this.send(state));
                await time("apply", () => this.apply(state));
                console.log(`succeed`);
            } catch (e) {
                console.error(`failed to send tx`);
                console.error(JSON.stringify(this.tx.toJSON(), null, "     "));
                throw e;
            }
        } else {
            try {
                await time("send", () => this.send(state));
                console.error(`expected to be failed, but succeed`);
                console.error(JSON.stringify(this.tx.toJSON(), null, "     "));
            } catch (e) {
                console.log("failed as expected: ", e);
                return;
            }
            throw new Error("Should fail but not failed");
        }
    }

    public abstract valid(state: State): boolean;

    protected async send(state: State): Promise<void> {
        console.log(`send ${this.tag}`);
        await this.txSender.send(state);
    }

    protected apply(state: State) {
        this.txSender.applyFee(state);
    }
}

export function approvedByRegistrar(
    state: State,
    assetType: H160,
    sender: PlatformAddress,
    approvers: PlatformAddress[],
) {
    const { registrar } = state.getAssetScheme(assetType);
    if (registrar) {
        if (registrar.value === sender.value) {
            return true;
        }
        return approvers.findIndex(approver => approver.value === registrar.value) !== -1;
    } else {
        return false;
    }
}

export function havePermission(
    state: State,
    assetType: H160,
    sender: PlatformAddress,
    approvers: PlatformAddress[],
) {
    if (approvedByRegistrar(state, assetType, sender, approvers)) {
        return true;
    }
    const { approver } = state.getAssetScheme(assetType);
    if (approver) {
        if (
            sender.value !== approver.value &&
            approvers.findIndex(x => sender.value === x.value) !== -1
        ) {
            return false;
        }
    }
    return true;
}
