import { NpmAPI } from "../src/NpmAPI";
import { NPMData } from "../src/NPMData";
const npmAPI=new NpmAPI("ghanalize");


test('fetching for Licence from NPM', async () => {
    const data = await npmAPI.fetchData() as NPMData;
    expect(data.license).toBe("ISC");
    expect(data.githubUrl).toBe("https://github.com/AbdullahCoban28/Ghanalize");
});
const npmAPI2= new NpmAPI("is-equal")
test('fetching for repo URL from NPM', async () => {
    const data = await npmAPI2.fetchData() as NPMData;
    expect(data.license).toBe("MIT");
    expect(data.githubUrl).toBe("https://github.com/inspect-js/is-equal");
});
const npmAPI3= new NpmAPI("is-even")
test('fetching for repo URL from NPM', async () => {
    const data = await npmAPI3.fetchData() as NPMData;
    expect(data.license).toBe("MIT");
    expect(data.githubUrl).toBe("https://github.com/jonschlinkert/is-even");
});
const npmAPI4= new NpmAPI("wrongname")
test('fetching for repo URL from NPM', async () => {
    const data = await npmAPI4.fetchData() as NPMData;
    expect(data.license).toBe("empty");
    expect(data.githubUrl).toBe("empty");
});
