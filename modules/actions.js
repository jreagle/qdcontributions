// INITIALIZE ACTIONS


// BUILD FAKE SPA => SINGLE-PAGE APPLICATIONS
// W/ TOGGLE SHOW SECTION
function toggleShowSection(target) {
    //targetSection = target.closest('section')
    document.querySelectorAll(`section`)
        .forEach(s => s.classList.add('d-none'))
    document.querySelector(`section#${target}`).classList.remove('d-none')
}

// INSTATIATE "QD" OBJECT
if (!localStorage.hasOwnProperty('qd')) {
    localStorage.setItem('qd', JSON.stringify({ cities: {}, github: {}, timestamp: new Date().getTime() }))
    const data = JSON.parse(localStorage.getItem('qd'))
    window.qd = data
} else {
    const data = JSON.parse(localStorage.getItem('qd'))
    window.qd = data
}



// BUILD WEB APPLICATION
(async () => {
    let optsUF = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]
    optsUF.forEach(uf => document.getElementById('selectUF').insertAdjacentHTML('beforeend', `<option value="${uf}">${uf}</option>`))
    let qdStatus = ['Desconhecido (0)', 'Conhecido (1)', "Coletado (2)", "Disponível (3)"]

    // LOAD DATA API (STATIC)
    if (Object.keys(qd.cities) <= 0) {
        qd = await fetch('data/qd.json').then(r => r.json())
        localStorage.setItem('qd', JSON.stringify(qd))
        console.log('LOAD DATA FROM STATIC SERVER!')
    } else {
        console.log('WORKING WITH LOCAL DATA')
    }

    // BUILD FAKE ROUTING
    let urlRequest = new URL(window.location.href)
    if (urlRequest.searchParams.has('city')) {
        if (Object.keys(qd.cities).includes(urlRequest.searchParams.get('city'))) {
            console.log('URL HAS CITY!')
            loadPageCity(urlRequest.searchParams.get('city'))
        }
    }
    document.body.classList.remove('d-none')

    // PARSE DATA API => TABULAR DATA => DATATABLES
    qd.table = Object.values(qd.cities).map(city => {
        let data = {}
        Object.assign(data, city.info)
        let status = qdStatus[data.level]
        let [commits, contributions, prs, issues, gazettes] = [0, 0, 0, 0, 0]
        if (Object.keys(city).includes('collects')) {
            gazettes = city.collects.total_gazettes

        }
        if (Object.keys(city).includes('spider')) {
            commits = city.spider.commits.length
        }
        if (Object.keys(city).includes('contributions')) {
            if (Object.keys(city.contributions).includes('prs')) {
                prs = city.contributions.prs.length
            }
            if (Object.keys(city.contributions).includes('issues')) {
                issues = city.contributions.issues.length
            }
            contributions = prs + issues
        }

        Object.assign(data, {
            status: status,
            gazettes: gazettes,
            commits: commits,
            contributions: contributions,
            prs: prs,
            issues: issues
        })
        return data
    })

    // INSTATIATE OJBECT DATATABLE AND LOAD TABULAR DATA
    window.qdTable =
        $('#tableOverview').DataTable({
            pageLength: 15,
            ordering: false,
            data: qd.table,
            columns: [
                { data: 'territory_id', className: 'text-center' },
                { data: 'territory_name', className: 'text-center' },
                { data: 'state_code', className: 'text-center' },
                { data: 'status', className: 'text-center' },
                { data: 'gazettes', className: 'text-center' },
                { data: 'contributions', className: 'text-center' },
            ],
            searchCols: [
                null,
                null,
                null,
                null,
                null,//{ search: 'Coletado' },
                null,
            ],
            layout: {
                topStart: '',
                topEnd: '',
            },
            language: {
                "decimal": "",
                "emptyTable": "Nenhum dado foi carregado",
                "info": "Exibindo _START_ to _END_ de _TOTAL_ registros",
                "infoEmpty": "Exibindo 0 a 0 de 0 registros",
                "infoFiltered": "(filtrados de _MAX_ total registros)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Exibindo _MENU_ registros",
                "loadingRecords": "Carregando...",
                "processing": "",
                "search": "Pesquisar:",
                "zeroRecords": "Nenhum combinação encontrada",
                "paginate": {
                    "first": "Primeiro",
                    "last": "Último",
                    "next": "Próximo",
                    "previous": "Anterior"
                },
                "aria": {
                    "orderable": "Ordenado por essa coluna",
                    "orderableReverse": "Ordem reversa dessa coluna"
                }
            }
        });

    $('#tableOverview tbody').on('click', 'tr', function () {
        loadPageCity(qdTable.row(this).data().territory_id)
    })

})()
    .finally('COMPLETE INITIALIZATION!')

// UTILS FUNCTIONS

function searchEnums(elem) {
    let [cellsIndex, expr] = [elem.closest('th').cellIndex, elem.value]
    //console.log(expr,'=>',cellsIndex)
    switch (expr.substring(0, 1)) {
        case '>':
            //console.log('GREATER =>',cellsIndex)
            qdTable.column(cellsIndex).search(d => d > parseInt(expr.replace(/\D/g, ''))).draw();
            break;
        case '<':
            //console.log('LESS =>',cellsIndex)
            qdTable.column(cellsIndex).search(d => d < parseInt(expr.replace(/\D/g, ''))).draw();
            break;
        default:
            //console.log('STATSWITH =>',cellsIndex)
            qdTable.column(cellsIndex).search(new RegExp('^' + expr, 'i')).draw();
    }
}

// LOAD DATA => CITY PAGE
function loadPageCity(idCity) {
    let cityData = qd.cities[idCity]
    let hideFields = ['status', 'commits', 'filename', 'contributions', 'prs', 'issues']

    // SETTLE ACCORDION (INFO)
    if (Object.keys(cityData).includes('info')) {
        let cityPageTitle = document.getElementById("cityPageTitle")
        let cityPageInfoContainer = document.getElementById("cityPageInfoContainer")
        cityPageTitle.innerHTML = `${cityData.info.territory_name} (${cityData.info.state_code})`
        document.getElementById('dtUpdate').innerHTML = new Date(parseInt(qd.timestamp)).toLocaleString().substring(0, 10)
        document.getElementById('dtUpdate').parentElement.classList.replace('d-none', 'd-block')
        cityPageInfoContainer.innerHTML = ''
        Object.entries(cityData.info).forEach(([k, v]) => {
            if (!hideFields.includes(k)) {
                if (k == 'query') {
                    cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b><a href="https://github.com/search?${new URLSearchParams({ q: v }).toString()}" target="_blank" rel="noopener noreferrer">${v}</a></li>`)
                } else if ('publication_urls') {
                    if (Array.isArray(v)) {
                        let listURLs = v.map(url => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></li>`).join('\n')
                        cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b><ul>${listURLs}</ul></li>`)
                    } else {
                        cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b>${v}</li>`)
                    }
                }
                else {
                    cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b>${v}</li>`)
                }
            }
        })
    }

    // SETTLE ACCORDION (SPIDER)
    if (Object.keys(cityData).includes('spider')) {
        let cityPageSpiderContainerCommits = document.getElementById("cityPageSpiderContainerCommits")
        linkSpider = `
            \xa0
            <i class="bi bi-github"></i>
            <a href="https://github.com/okfn-brasil/querido-diario/tree/main/${cityData.spider.path}" target="_blank" rel="noopener noreferrer">${cityData.spider.path}</a>
            `
        //cityPageSpiderContainer.firstElementChild.innerHTML
        document.getElementById('linkSpider').innerHTML = linkSpider
        document.getElementById('lenCommits').innerHTML = cityData.spider.commits.length
        cityPageSpiderContainerCommits.innerHTML = ''
        Object.entries(cityData.spider.commits).forEach(([k, v]) => {
            cityPageSpiderContainerCommits
                .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.messageHeadline}</a> (${v.oid.slice(0, 7)}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.name}</span> | <span>${v.committedDate}</span>
                        </li>`)
        })
    } else {
        document.getElementById('linkSpider').innerHTML = '\xa0(Não encontrado!)'
        cityPageSpiderContainerCommits.innerHTML = '(Não encontrados!)'
        document.getElementById('lenCommits').innerHTML = 0
    }

    document.getElementById('totalGazettes').href = `https://queridodiario.ok.org.br/api/gazettes?territory_ids=${idCity}&size=1`
    if (Object.keys(cityData).includes('collects')) {
        document.getElementById('totalGazettes').classList.replace('text-bg-secondary', 'text-bg-primary')
        document.getElementById('totalGazettes').innerHTML = cityData.collects.total_gazettes
    } else {
        document.getElementById('totalGazettes').classList.replace('text-bg-primary', 'text-bg-secondary')
        document.getElementById('totalGazettes').innerHTML = 0
    }

    // SETTLE ACCORDION (CONTRIUTIONS)
    if (Object.keys(cityData).includes('contributions')) {

        if (Object.keys(cityData.contributions).includes('prs')) {
            let cityPageContributionsContainerPulls = document.getElementById('cityPageContributionsContainerPulls')
            document.getElementById('lenPulls').innerHTML = cityData.contributions.prs.length
            cityPageContributionsContainerPulls.innerHTML = ''
            Object.entries(cityData.contributions.prs).forEach(([k, v]) => {
                cityPageContributionsContainerPulls
                    .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                        </li>`)
            })
        } else {
            document.getElementById('lenPulls').innerHTML = 0
            cityPageContributionsContainerPulls.innerHTML = '<p>Sem informações!</p>'
        }
        if (Object.keys(cityData.contributions).includes('issues')) {
            let cityPageContributionsContainerIssues = document.getElementById('cityPageContributionsContainerIssues')
            document.getElementById('lenIssues').innerHTML = cityData.contributions.issues.length
            cityPageContributionsContainerIssues.innerHTML = ''
            Object.entries(cityData.contributions.issues).forEach(([k, v]) => {
                cityPageContributionsContainerIssues
                    .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                        </li>`)
            })
        } else {
            document.getElementById('lenIssues').innerHTML = 0
            cityPageContributionsContainerIssues.innerHTML = '<p>Sem informações!</p>'
        }
        document.getElementById('lenContrib').innerHTML = parseInt(document.getElementById('lenPulls').innerText) + parseInt(document.getElementById('lenIssues').innerText)


    } else {
        document.getElementById('lenContrib').innerHTML = 0
        document.getElementById('lenPulls').innerHTML = 0
        document.getElementById('lenIssues').innerHTML = 0
        cityPageContributionsContainerPulls.innerHTML = '<p>Sem informações!</p>'
        cityPageContributionsContainerIssues.innerHTML = '<p>Sem informações!</p>'
    }


    toggleShowSection('cityPage')
}
