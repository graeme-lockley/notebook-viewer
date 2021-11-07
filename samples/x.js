import stdlib from "@observablehq/stdlib";

const library = new stdlib.Library()


function fred(strings, ...keys) {
  const result = [];

  result.push([strings[0]]);

  for (let i = 0; i < strings.length; i += 1) {
    result.push(keys[i]);
    result.push(strings[i + 1]);
  }

  return result.join("");
}

const a = 10;
const b = 5;

console.log(eval("fred`Hello ${a + b}`"));

// console.log(fred`Hello: ${a + b}`);

function* now(count) {
  let lp = 0;
  let last = Date.now();
  while (lp++ < count) {
    let current = Date.now();
    while (current === last)
      current = Date.now();
    last = current;
    yield current;
  }
}

console.log([...now(10)]);
