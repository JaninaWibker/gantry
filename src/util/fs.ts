import fs from 'fs/promises'

const read_json = (filepath: string): Promise<object> =>
  fs.readFile(filepath, 'utf-8')
    .then(content => JSON.parse(content))

const write_json = (filepath: string, json: object): Promise<void> =>
  fs.writeFile(filepath, JSON.stringify(json), 'utf-8')

const write_json_if_differ = (filepath: string, json: object): Promise<boolean> => {

  const exists = fs.stat(filepath)
    .then(() => true)
    .catch(() => false)
  const read = () => read_json(filepath)
  const write = () => write_json(filepath, json).then(() => true)
  const compare = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b)

  return exists
    .then(exists => exists
      ? read()
        .then(result_json =>
          compare(result_json, json)
            ? false
            : write()
        )
      : write())
}

export {
  read_json,
  write_json,
  write_json_if_differ,
}
