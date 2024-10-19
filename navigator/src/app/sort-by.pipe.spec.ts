import { SortByPipe } from './sort-by.pipe';

describe('SortByPipe', () => {
  let pipe: SortByPipe;
  const testData: {name: string}[] = [
    {name: "Alpha"}, {name: "Omega"}, {name: "Beta"}
  ]
  const expected: {name: string}[] = [
    {name: "Alpha"}, {name: "Beta"}, {name: "Omega"}
  ]

  beforeEach(() => {
    pipe = new SortByPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should sort the object array by the provided field', () => {
    expect(pipe.transform(testData, 'name')).toEqual(expected);
  });

  it('should return an empty array if the input array is empty', () => {
    expect(pipe.transform([], 'name')).toEqual([]);
  });

  it('should return the input array if field is not provided', () => {
    expect(pipe.transform(testData, '')).toEqual(testData);
  });
});
