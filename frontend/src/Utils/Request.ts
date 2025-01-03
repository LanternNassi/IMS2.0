import axios , {AxiosInstance} from 'axios'

const api : AxiosInstance = axios.create({
    baseURL : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
})

export default api