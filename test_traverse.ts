import traverse from '@babel/traverse';
console.log('typeof traverse', typeof traverse);
console.log('traverse.visitors', traverse.visitors);
if ((traverse as any).default) {
  console.log('traverse.default.visitors', (traverse as any).default.visitors);
}
