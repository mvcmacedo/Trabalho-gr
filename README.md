## Gerência de Redes - 2019/1

O trabalho consiste em implementar parcialmente um gerente SNMP, utilizando
uma API de desenvolvimento SNMP e geração de gráficos para análise das informações.
Antes do gerente começar sua execução, as seguintes configurações devem ser
informadas (usando uma interface gráfica):
- IP da máquina que será gerenciada;
- comunidade;
- valor da instância do objeto que deve ser acessada; e
- definição do tempo de periodicidade utilizado para capturar e atualizar as
informações nos gráficos.

As seguintes métricas devem ser apresentadas graficamente pela ferramenta:
- utilização do link (1 gráfico)
- taxa de datagramas IP recebidos e enviados (2 gráficos)
- taxa de pacotes TCP recebidos e enviados (2 gráficos)
- taxa de pacotes UDP recebidos e enviados (2 gráficos)
- taxa de pacotes ICMP recebidos e enviados (2 gráficos)
- taxa de pacotes SNMP recebidos e enviados (2 gráficos)

Para cada uma das métricas, a aplicação deve permitir a definição de limites
inferior e superior de utilização e gerar alarmes quando algum limite for ultrapassado.

Observação: A visualização de objetos contadores deve ocorrer com a
diminuição do valor atual pelo amostrado anteriormente.
