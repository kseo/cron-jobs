import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { SDK } from "codechain-sdk";
import * as config from "config";
import * as fs from "fs";
import "mocha";
import * as randomstring from "randomstring";
import { createUsers, loadUsers, storeUsers } from "./users";

chai.use(chaiAsPromised);
const expect = chai.expect;

const networkId = config.get<string>("network_id");

const rpcUrl = config.get<string>("rpc_url");
const sdk = new SDK({ server: rpcUrl, networkId });

describe("Users", async function() {
    const passphrase = "pass";
    let userFilePath: string;

    beforeEach(async function() {
        userFilePath = `./.test-gen/user-${randomstring.generate({
            length: 12,
            charset: "alphabetic"
        })}`;
    });

    it("create 60 users", async function() {
        const users = await createUsers(sdk, passphrase);
        expect(users.length).equal(60);
    }).timeout(60_000);

    it("Cannot read when there is no file.", function() {
        expect(loadUsers(userFilePath)).to.be.rejected;
    });

    it("Read stored data.", async function() {
        const originalUsers = await createUsers(sdk, passphrase);
        await storeUsers(userFilePath, originalUsers);
        const recoveredUsers = await loadUsers(userFilePath);
        expect(recoveredUsers).deep.equal(originalUsers);
    }).timeout(60_000);

    afterEach(function() {
        try {
            fs.unlinkSync(userFilePath);
        } catch (err) {
            return;
        }
    });
});
