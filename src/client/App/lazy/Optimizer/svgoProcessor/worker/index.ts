import { optimize, CustomPlugin } from 'svgo';
import exposeWorkerActions from '../../utils/exposeWorkerActions';

const createDimensionsExtractor = () => {
  const dimensions = { width: 0, height: 0 };
  const plugin: CustomPlugin = {
    name: 'extract-dimensions',
    fn() {
      return {
        element: {
          // Node, parentNode
          enter({ name, attributes }, { type }) {
            if (name === 'svg' && type === 'root') {
              if (
                attributes.width !== undefined &&
                attributes.height !== undefined
              ) {
                dimensions.width = Number.parseFloat(attributes.width);
                dimensions.height = Number.parseFloat(attributes.height);
              } else if (attributes.viewBox !== undefined) {
                const viewBox = attributes.viewBox.split(/,\s*|\s+/);
                dimensions.width = Number.parseFloat(viewBox[2]);
                dimensions.height = Number.parseFloat(viewBox[3]);
              }
            }
          },
        },
      };
    },
  };

  return [dimensions, plugin] as const;
};

exposeWorkerActions({
  ready: () => true,

  compress: ({ source }: { source: string }): string => {
    return optimize(source).data;
  },

  getDimensions: ({
    source,
  }: {
    source: string;
  }): { width: number; height: number } => {
    const [dimensions, plugin] = createDimensionsExtractor();
    optimize(source, { plugins: [plugin] });
    return dimensions;
  },
});
