export function Typography() {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Typography</h2>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Headings</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-400">heading-1 (text-3xl font-bold)</span>
            <h1 className="text-3xl font-bold text-deep-space">The quick brown fox</h1>
          </div>
          <div>
            <span className="text-sm text-gray-400">heading-2 (text-2xl font-semibold)</span>
            <h2 className="text-2xl font-semibold text-deep-space">The quick brown fox</h2>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Body</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-400">body (text-base)</span>
            <p className="text-base text-deep-space">The quick brown fox jumps over the lazy dog. This is body text used for main content and descriptions.</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">small (text-sm)</span>
            <p className="text-sm text-gray-600">The quick brown fox jumps over the lazy dog. This is small text for captions and metadata.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Interactive</h3>
        <div className="space-y-2">
          <p><a href="#" className="text-blue-green hover:underline">Link text</a></p>
          <p className="font-medium text-deep-space">Bold/Medium weight</p>
        </div>
      </section>
    </div>
  );
}
