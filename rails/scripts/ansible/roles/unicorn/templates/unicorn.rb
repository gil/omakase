root = "/home/{{ ansible_ssh_user }}/apps/webapp/current/rails"
working_directory root
pid "#{root}/tmp/pids/unicorn.pid"
stderr_path "#{root}/log/unicorn.log"
stdout_path "#{root}/log/unicorn.log"

listen "/tmp/unicorn.webapp.sock"
worker_processes 2
timeout 30