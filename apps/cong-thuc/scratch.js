import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

const text = `Nghiệm của phương trình $ax^2 + bx + c = 0$ được tính bởi công thức:
$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$`;

console.log(marked.parse(text));
