import { request } from "graphql-request";
import { User } from "../../entity/User";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "./errorMessages";
import { createTypeormConn } from "../../utils/createTypeormConn";

const email = "tom@bob.com";
const password = "jalksdf";

const mutation = (e: string, p: string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

beforeAll(async () => {
  await createTypeormConn();
});

describe("Register user", async () => {
  it("check for duplicate emails", async () => {
    // make sure we can register a user
    const response = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  it("check bad email", async () => {
    const response3: any = await request(
      process.env.TEST_HOST as string,
      mutation("b", password)
    );
    expect(response3).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        }
      ]
    });
  });

  it("check bad password", async () => {
    // catch bad password
    const response4: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, "ad")
    );
    expect(response4).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });

  it("check bad password and bad email", async () => {
    const response5: any = await request(
      process.env.TEST_HOST as string,
      mutation("df", "ad")
    );
    expect(response5).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        },
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });
});
