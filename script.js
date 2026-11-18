const formulario = document.getElementById('formulario');
const cidade = document.getElementById('cidade');
const mensagem = document.getElementById('mensagem');
const resultados = document.getElementById('resultados');

const climaAtual = document.getElementById('climaAtual');
const previsao = document.getElementById('previsao');

const secaoClima = document.getElementById('secaoClima');
const secaoPrevisao = document.getElementById('secaoPrevisao');

const botaoFavorito = document.getElementById('botaoFavorito');
const botaoBuscar = document.getElementById('botaoBuscar');
const favoritos = document.getElementById('favoritos');

let cidadeSelecionada = null;
let listaFavoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

const descricoes = {
    0: 'Céu limpo ☀️',
    1: 'Poucas nuvens 🌤️',
    2: 'Parcialmente nublado ⛅',
    3: 'Nublado ☁️',
    45: 'Nevoeiro 🌫️',
    48: 'Nevoeiro 🌫️',
    51: 'Garoa 🌦️',
    53: 'Garoa moderada 🌦️',
    55: 'Garoa forte 🌧️',
    61: 'Chuva fraca 🌧️',
    63: 'Chuva moderada 🌧️',
    65: 'Chuva forte 🌧️',
    71: 'Neve ❄️',
    73: 'Neve moderada ❄️',
    75: 'Neve forte ❄️',
    80: 'Pancadas de chuva 🌧️',
    81: 'Chuva moderada 🌧️',
    82: 'Chuva forte ⛈️',
    95: 'Tempestade ⛈️',
    96: 'Tempestade com granizo',
    99: 'Tempestade forte ⛈️'
};

// Consultar API
async function consultarAPI(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error('Erro na consulta.');
    }

    return resposta.json();
}

// Pesquisar cidade
formulario.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const nome = cidade.value.trim();

    if (nome.length < 2) {
        mensagem.textContent = 'Digite pelo menos duas letras.';
        return;
    }

    botaoBuscar.disabled = true;
    mensagem.textContent = 'Pesquisando...';
    resultados.replaceChildren();

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=10&language=pt&format=json`;

        const dados = await consultarAPI(url);

        if (!dados.results) {
            mensagem.textContent = 'Cidade não encontrada.';
            return;
        }

        dados.results.forEach(local => {
            const item = document.createElement('div');
            const nomeLocal = document.createElement('p');
            const botao = document.createElement('button');

            item.className = 'resultado-cidade';
            nomeLocal.textContent = `${local.name}, ${local.country}`;
            botao.textContent = 'Consultar clima';

            botao.addEventListener('click', () => consultarClima(local));

            item.append(nomeLocal, botao);
            resultados.appendChild(item);
        });

        mensagem.textContent = 'Selecione uma cidade.';

    } catch (erro) {
        mensagem.textContent = 'Erro ao pesquisar cidade.';
    }

    botaoBuscar.disabled = false;
});

// Consultar clima
async function consultarClima(local) {
    mensagem.textContent = 'Carregando clima...';

    secaoClima.hidden = true;
    secaoPrevisao.hidden = true;
    botaoFavorito.disabled = true;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${local.latitude}&longitude=${local.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;

        const dados = await consultarAPI(url);

        cidadeSelecionada = local;

        mostrarClima(local, dados);
        mostrarPrevisao(dados);

        secaoClima.hidden = false;
        secaoPrevisao.hidden = false;

        mensagem.textContent = 'Consulta realizada!';

    } catch (erro) {
        mensagem.textContent = 'Erro ao consultar o clima.';
    }

    botaoFavorito.disabled = false;
}

// Mostrar clima atual
function mostrarClima(local, dados) {
    const atual = dados.current;

    climaAtual.innerHTML = `
        <div class="cartao-clima">
            <h3>${local.name}, ${local.country}</h3>
            <p class="temperatura">${atual.temperature_2m} °C</p>
            <p>${descricoes[atual.weather_code] || 'Clima não identificado'}</p>
            <p>Sensação térmica: ${atual.apparent_temperature} °C</p>
            <p>Umidade: ${atual.relative_humidity_2m}%</p>
            <p>Vento: ${atual.wind_speed_10m} km/h</p>
        </div>
    `;
}

// Mostrar previsão
function mostrarPrevisao(dados) {
    previsao.replaceChildren();

    const dias = dados.daily;

    dias.time.forEach((data, i) => {
        const cartao = document.createElement('div');

        cartao.className = 'cartao-dia';

        cartao.innerHTML = `
            <h3>${data.split('-').reverse().join('/')}</h3>
            <p>${descricoes[dias.weather_code[i]] || 'Clima não identificado'}</p>
            <p>Mínima: ${dias.temperature_2m_min[i]} °C</p>
            <p>Máxima: ${dias.temperature_2m_max[i]} °C</p>
            <p>Chuva: ${dias.precipitation_probability_max[i] ?? 'Não disponível'}${dias.precipitation_probability_max[i] == null ? '' : '%'}</p>
        `;

        previsao.appendChild(cartao);
    });
}

// Adicionar favorito
botaoFavorito.addEventListener('click', function() {
    if (!cidadeSelecionada) return;

    const existe = listaFavoritos.some(local =>
        local.latitude === cidadeSelecionada.latitude &&
        local.longitude === cidadeSelecionada.longitude
    );

    if (existe) {
        mensagem.textContent = 'Cidade já está nos favoritos.';
        return;
    }

    listaFavoritos.push(cidadeSelecionada);

    salvarFavoritos();
    mensagem.textContent = 'Cidade adicionada aos favoritos!';
});

// Salvar favoritos
function salvarFavoritos() {
    localStorage.setItem('favoritos', JSON.stringify(listaFavoritos));
    mostrarFavoritos();
}

// Mostrar favoritos
function mostrarFavoritos() {
    favoritos.replaceChildren();

    if (listaFavoritos.length === 0) {
        favoritos.textContent = 'Nenhuma cidade favorita.';
        return;
    }

    listaFavoritos.forEach((local, i) => {
        const item = document.createElement('div');
        const nome = document.createElement('span');
        const consultar = document.createElement('button');
        const remover = document.createElement('button');

        item.className = 'favorito';
        nome.textContent = `${local.name}, ${local.country}`;

        consultar.textContent = 'Consultar';
        remover.textContent = 'Remover';

        consultar.addEventListener('click', () => consultarClima(local));

        remover.addEventListener('click', () => {
            listaFavoritos.splice(i, 1);
            salvarFavoritos();
            mensagem.textContent = 'Favorito removido.';
        });

        item.append(nome, consultar, remover);
        favoritos.appendChild(item);
    });
}

// Carregar favoritos ao abrir a página
mostrarFavoritos();
