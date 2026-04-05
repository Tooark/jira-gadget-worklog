import { ButtonGroup } from '@atlaskit/button';
import Button from '@atlaskit/button/new';
import Form, { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Select from '@atlaskit/select';

import type { FormValues, EditProps } from '../types';
import { useForgeInvoke } from '../hooks';

export default function Edit(props: EditProps) {
  // Busca a lista de usuários (backend deve expor 'getUsers')
  const users =
    useForgeInvoke<Array<{ label: string; value: string }>>('getUsers');

  // Opções de cores para o gráfico
  const colorOptions: Array<{ label: string; value: string }> = [
    { label: 'Colorido', value: 'color' },
    { label: 'Azul', value: 'blue' },
    { label: 'Cinza', value: 'gray' },
    { label: 'Laranja', value: 'orange' },
    { label: 'Verde', value: 'green' },
    { label: 'Vermelho', value: 'red' },
  ];

  const formValues: FormValues = {
    ...(props.formValues ?? {}),
    days: props.formValues?.days ?? 7,
    color: props.formValues?.color ?? 'color',
    jql: props.formValues?.jql ?? '',
    users: props.formValues?.users ?? [],
  };

  return (
    <div style={{ height: '100%', width: 'calc(100% - 20px)', margin: 0, padding: '10px' }}>
      <Form<FormValues> onSubmit={(event) => props.view.submit(event)}>
        {({ formProps, submitting }) => (
          <form {...formProps}>
            <Field
              name="days"
              label="Dias"
              defaultValue={formValues.days}
            >
              {({ fieldProps }) => (
                <TextField {...fieldProps} type="number" placeholder="7" />
              )}
            </Field>

            <Field
              name="color"
              label="Cor do Gráfico"
              defaultValue={formValues.color}
            >
              {({ fieldProps }) => (
                <Select
                  {...fieldProps}
                  options={colorOptions}
                  isMulti={false}
                  placeholder="Selecione a cor"
                  value={
                    colorOptions.find((o) => o.value === fieldProps.value) ||
                    null
                  }
                  onChange={(selected: any) =>
                    fieldProps.onChange(selected ? selected.value : '')
                  }
                />
              )}
            </Field>

            <Field
              name="users"
              label="Usuários"
              defaultValue={formValues.users}
            >
              {({ fieldProps }) => (
                <Select
                  inputId="users"
                  closeMenuOnSelect={false}
                  options={users || []}
                  isMulti
                  value={(users || []).filter((o) =>
                    fieldProps.value?.includes?.(o.value),
                  )}
                  onChange={(selected: any) =>
                    fieldProps.onChange(
                      selected ? selected.map((s: any) => s.value) : [],
                    )
                  }
                  menuShouldBlockScroll={false}
                />
              )}
            </Field>

            <Field
              name="jql"
              label="JQL Adicional"
              defaultValue={formValues.jql}
            >
              {({ fieldProps }) => <TextField {...fieldProps} />}
            </Field>

            <br />

            <ButtonGroup>
              <Button
                appearance="primary"
                type="submit"
                isDisabled={submitting}
              >
                Salvar
              </Button>

              <Button onClick={() => props.view.submit(formValues)}>
                Cancelar
              </Button>
            </ButtonGroup>
          </form>
        )}
      </Form>
    </div>
  );
}
