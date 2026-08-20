import assert from 'node:assert/strict';
import { PDFDocument, degrees, rgb } from 'pdf-lib';

function equalBytes(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function makeSource() {
  const source = await PDFDocument.create();
  for (let index = 1; index <= 3; index += 1) {
    const page = source.addPage([240, 180]);
    page.drawText(`Source page ${index}`, { x: 30, y: 100, size: 18, color: rgb(0, 0, 0) });
  }
  source.setTitle('CachePDF source');
  source.setAuthor('CachePDF verification');
  return source.save();
}

async function load(bytes) { return PDFDocument.load(bytes); }
async function pageCount(bytes) { return (await load(bytes)).getPageCount(); }

const sourceBytes = await makeSource();
const sourceBaseline = new Uint8Array(sourceBytes);

const reorderedSource = await load(sourceBytes);
const reordered = await PDFDocument.create();
const reorderedPages = await reordered.copyPages(reorderedSource, [2, 0, 1]);
reorderedPages.forEach((page) => reordered.addPage(page));
assert.equal(await pageCount(await reordered.save()), 3, 'reorder output keeps three pages');

const extractedSource = await load(sourceBytes);
const extracted = await PDFDocument.create();
const extractedPages = await extracted.copyPages(extractedSource, [0, 2]);
extractedPages.forEach((page) => extracted.addPage(page));
assert.equal(await pageCount(await extracted.save()), 2, 'extract output keeps selected pages');

const deletedSource = await load(sourceBytes);
deletedSource.removePage(1);
assert.equal(await pageCount(await deletedSource.save()), 2, 'delete output removes requested page');

const rotatedSource = await load(sourceBytes);
rotatedSource.getPage(0).setRotation(degrees(90));
assert.equal((await load(await rotatedSource.save())).getPage(0).getRotation().angle, 90, 'rotate output persists rotation');

const markedSource = await load(sourceBytes);
markedSource.getPages().forEach((page, index) => {
  page.drawText(String(index + 1), { x: 200, y: 20, size: 10 });
  page.drawText('CONFIDENTIAL', { x: 40, y: 80, size: 20, opacity: 0.2, rotate: degrees(35) });
});
assert.equal(await pageCount(await markedSource.save()), 3, 'mark output stays valid');

const metadataSource = await load(sourceBytes);
metadataSource.setTitle(''); metadataSource.setAuthor(''); metadataSource.setSubject(''); metadataSource.setKeywords([]); metadataSource.setCreator(''); metadataSource.setProducer('');
const metadataClean = await load(await metadataSource.save());
assert.equal(metadataClean.getTitle(), '', 'metadata title is cleared');
assert.equal(metadataClean.getAuthor(), '', 'metadata author is cleared');

const merged = await PDFDocument.create();
for (const bytes of [sourceBytes, sourceBytes]) {
  const document = await load(bytes);
  const copied = await merged.copyPages(document, document.getPageIndices());
  copied.forEach((page) => merged.addPage(page));
}
assert.equal(await pageCount(await merged.save()), 6, 'merge output includes both source documents');

assert.ok(equalBytes(sourceBytes, sourceBaseline), 'source bytes remain unchanged throughout every transformation test');
console.log('CachePDF core PDF invariant checks passed.');
