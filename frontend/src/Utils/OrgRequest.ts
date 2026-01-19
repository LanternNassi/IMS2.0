import axios, {AxiosInstance} from 'axios'


const ORG_BASE_URL = process.env.NEXT_PUBLIC_ORG_URL || 'http://localhost:10000'


const OrgAPI : AxiosInstance = axios.create({
    baseURL: `${ORG_BASE_URL}`
})


export default OrgAPI