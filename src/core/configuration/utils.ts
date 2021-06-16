export function mergeNameParts(...args: string[]): string {
  return args.filter((value) => value).join('.');
}

export function parseOptionName(name: string): IOptionInfo | ICollectionOptionInfo {
  const parts = name.split('[');

  if (parts.length === 1) {
    return {
      isCollectionItem: false,
      name,
    };
  }

  return {
    isCollectionItem: true,
    name: parts[0],
    index: Number(parts[1].slice(0, -1)),
  };
}

interface IOptionInfo {
  isCollectionItem: false;
  name: string;
}

interface ICollectionOptionInfo {
  isCollectionItem: true;
  name: string;
  index: number;
}

export const shallowEquals = (
  first: Record<string, unknown>,
  second: Record<string, unknown>,
): boolean => {
  if (Object.keys(first).length !== Object.keys(second).length) {
    return false;
  }

  return Object.keys(first).every((key) => first[key] === second[key]);
};
